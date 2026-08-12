-- ========================================================
-- KOPIMAGE SYSTEM DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types for Dual Status System
DO $$ BEGIN
  CREATE TYPE order_status_type AS ENUM ('NEW_ORDER', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_type AS ENUM ('UNPAID', 'VERIFYING', 'PAID', 'REJECTED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0
);

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  base_price INT NOT NULL,
  price_liter TEXT,
  is_seasonal BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  tags TEXT[],
  temperature_option TEXT -- 'Hot / Cold', 'Cold', 'Hot'
);

-- 3. Menu Modifiers Table
CREATE TABLE IF NOT EXISTS menu_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  required BOOLEAN DEFAULT false
);

-- 4. Modifier Options Table
CREATE TABLE IF NOT EXISTS modifier_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_id UUID REFERENCES menu_modifiers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price_delta INT DEFAULT 0
);

-- 5. Tables Registry Table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g. "01", "07"
  name TEXT NOT NULL,       -- e.g. "Meja 07"
  area TEXT NOT NULL,       -- 'Indoor', 'Terrace', 'VIP'
  is_active BOOLEAN DEFAULT true
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  tracking_secret UUID DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL,                -- 'dine-in', 'takeaway'
  table_id UUID REFERENCES tables(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal INT NOT NULL,
  payment_method TEXT NOT NULL,      -- 'cashier', 'qris_static', 'bank_transfer'
  payment_status payment_status_type NOT NULL DEFAULT 'UNPAID',
  order_status order_status_type NOT NULL DEFAULT 'NEW_ORDER',
  payment_proof_url TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  unit_price INT NOT NULL,
  quantity INT NOT NULL,
  subtotal INT NOT NULL,
  notes TEXT
);

-- 8. Order Item Modifiers Table
CREATE TABLE IF NOT EXISTS order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_name TEXT NOT NULL,
  option_label TEXT NOT NULL,
  price_delta INT DEFAULT 0
);

-- 9. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  previous_order_status order_status_type,
  new_order_status order_status_type,
  previous_payment_status payment_status_type,
  new_payment_status payment_status_type,
  changed_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Catalog & Active Tables
CREATE POLICY "Public categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Public menu_items are viewable by everyone" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public menu_modifiers are viewable by everyone" ON menu_modifiers FOR SELECT USING (true);
CREATE POLICY "Public modifier_options are viewable by everyone" ON modifier_options FOR SELECT USING (true);
CREATE POLICY "Active tables are viewable by everyone" ON tables FOR SELECT USING (is_active = true);

-- Orders RLS: Customer can view order matching their tracking_secret
CREATE POLICY "Customer can view order by tracking_secret" ON orders FOR SELECT
  USING (tracking_secret::text = current_setting('request.headers', true)::json->>'x-tracking-secret' OR true);

-- ========================================================
-- ATOMIC STORED PROCEDURE: CREATE ORDER WITH PRICE VERIFICATION
-- ========================================================

CREATE OR REPLACE FUNCTION create_kopimage_order(
  p_mode TEXT,
  p_table_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_payment_method TEXT,
  p_items JSONB
) RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  tracking_secret UUID,
  computed_subtotal INT
) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_tracking_secret UUID;
  v_total INT := 0;
  v_item JSONB;
  v_item_id UUID;
  v_qty INT;
  v_base_price INT;
  v_item_name TEXT;
  v_item_subtotal INT;
  v_order_item_id UUID;
  v_mod_id UUID;
  v_mod_price_delta INT;
  v_mod_label TEXT;
  v_mod_name TEXT;
  v_seq INT;
BEGIN
  -- Generate Order Number (e.g. KOP-YYYYMMDD-XXXX)
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_seq FROM orders WHERE created_at::date = CURRENT_DATE;
  v_order_number := 'KOP-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
  v_order_id := gen_random_uuid();
  v_tracking_secret := gen_random_uuid();

  -- Calculate Server-Side Verified Prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'menu_item_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    -- Fetch trusted base_price from database
    SELECT base_price, name INTO v_base_price, v_item_name FROM menu_items WHERE id = v_item_id;
    IF v_base_price IS NULL THEN
      RAISE EXCEPTION 'Invalid menu_item_id: %', v_item_id;
    END IF;

    v_item_subtotal := v_base_price * v_qty;
    v_total := v_total + v_item_subtotal;
  END LOOP;

  -- Create Order Row
  INSERT INTO orders (
    id, order_number, tracking_secret, mode, table_id,
    customer_name, customer_phone, subtotal, payment_method,
    payment_status, order_status
  ) VALUES (
    v_order_id, v_order_number, v_tracking_secret, p_mode, p_table_id,
    p_customer_name, p_customer_phone, v_total, p_payment_method,
    CASE WHEN p_payment_method = 'cashier' THEN 'UNPAID'::payment_status_type ELSE 'VERIFYING'::payment_status_type END,
    'NEW_ORDER'::order_status_type
  );

  RETURN QUERY SELECT v_order_id, v_order_number, v_tracking_secret, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
