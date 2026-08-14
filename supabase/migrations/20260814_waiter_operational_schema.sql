-- ====================================================================
-- KOPIMAGE OPERATIONAL & WAITER SYSTEM MIGRATION (FINAL PRODUCTION APPLIED)
-- Target: Supabase PostgreSQL
-- ====================================================================

-- 1. Tambah DELIVERING ke Enum Status Order existing
DO $$ BEGIN
  ALTER TYPE order_status_type ADD VALUE IF NOT EXISTS 'DELIVERING';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Buat Enum Status Meja Fisik Terstruktur
DO $$ BEGIN
  CREATE TYPE table_status_type AS ENUM (
    'KOSONG',
    'TERISI',
    'PESANAN_DIPROSES',
    'SEDANG_MAKAN',
    'BUTUH_BANTUAN',
    'PERLU_DIBERSIHKAN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tambah Kolom Status pada Tabel tables (Non-destructive)
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status table_status_type NOT NULL DEFAULT 'KOSONG';

-- 4. Buat Enum Tipe & Status Panggilan Waiter
DO $$ BEGIN
  CREATE TYPE request_type_enum AS ENUM ('BANTUAN', 'BILL', 'LAINNYA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM ('OPEN', 'HANDLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Buat Tabel waiter_requests
CREATE TABLE IF NOT EXISTS waiter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE NOT NULL,
  table_code TEXT NOT NULL,
  request_type request_type_enum NOT NULL DEFAULT 'BANTUAN',
  status request_status_enum NOT NULL DEFAULT 'OPEN',
  notes TEXT,
  handled_by TEXT,
  handled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Buat Indeks Performa untuk Query Cepat Antrean Meja
CREATE INDEX IF NOT EXISTS idx_waiter_requests_status ON waiter_requests(status);
CREATE INDEX IF NOT EXISTS idx_waiter_requests_table_code ON waiter_requests(table_code);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);

-- 7. Trigger Otomatis untuk updated_at Timestamp
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_waiter_requests_updated_at ON waiter_requests;
CREATE TRIGGER trg_waiter_requests_updated_at
BEFORE UPDATE ON waiter_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- 8. Row Level Security (RLS) Policies
ALTER TABLE waiter_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view waiter requests" ON waiter_requests;
DROP POLICY IF EXISTS "Public can insert waiter requests" ON waiter_requests;
DROP POLICY IF EXISTS "Staff can update waiter requests" ON waiter_requests;

-- Policy A: SELECT diizinkan untuk Public/Anon (Wajib agar Realtime WebSocket Engine dapat mengirim event)
CREATE POLICY "Public can view waiter requests"
ON waiter_requests FOR SELECT
USING (true);

-- Policy B: INSERT diizinkan untuk Public dengan validasi kolom
CREATE POLICY "Public can insert waiter requests"
ON waiter_requests FOR INSERT
WITH CHECK (
  table_id IS NOT NULL AND
  table_code IS NOT NULL
);

-- 9. Daftarkan Tabel ke Supabase Realtime Publication secara Idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'waiter_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE waiter_requests;
  END IF;
END $$;
