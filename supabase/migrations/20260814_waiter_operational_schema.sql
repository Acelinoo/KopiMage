-- ====================================================================
-- KOPIMAGE FINAL OPERATIONAL SCHEMA ENHANCEMENT (NON-DESTRUCTIVE)
-- Blueprint Migration for Waiter Operational System & Table Floor State
-- ====================================================================

-- 1. Tambah DELIVERING ke Enum Status Order existing (tanpa menghapus COMPLETED)
DO $$ BEGIN
  ALTER TYPE order_status_type ADD VALUE IF NOT EXISTS 'DELIVERING';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Buat Enum Status Meja Terstruktur (Non-nullable with DEFAULT 'KOSONG')
DO $$ BEGIN
  CREATE TYPE table_status_type AS ENUM (
    'KOSONG',            -- Meja bersih & siap digunakan customer baru
    'TERISI',            -- Customer duduk di meja (opsional future compatibility)
    'PESANAN_DIPROSES',  -- Ada order aktif yang sedang diracik / diantar
    'SEDANG_MAKAN',      -- Seluruh order sudah disajikan ke meja
    'BUTUH_BANTUAN',     -- Customer mengirim request bantuan / bill
    'PERLU_DIBERSIHKAN'  -- Customer selesai/pergi, piring kotor siap dibersihkan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tambah Kolom Status pada Tabel tables existing
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status table_status_type NOT NULL DEFAULT 'KOSONG';

-- 4. Buat Enum & Tabel waiter_requests dengan Foreign Key UUID ke tables.id
DO $$ BEGIN
  CREATE TYPE request_type_enum AS ENUM ('BANTUAN', 'BILL', 'LAINNYA');
  CREATE TYPE request_status_enum AS ENUM ('OPEN', 'HANDLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- 5. Enable Row Level Security (RLS) pada tabel waiter_requests
ALTER TABLE waiter_requests ENABLE ROW LEVEL SECURITY;

-- 6. Policy RLS: Public dapat membuat request & membaca request meja terkait
DO $$ BEGIN
  CREATE POLICY "Public can insert waiter requests" ON waiter_requests FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public can view waiter requests" ON waiter_requests FOR SELECT USING (true);
  CREATE POLICY "Staff can update waiter requests" ON waiter_requests FOR UPDATE USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 7. Tambahkan ke Supabase Realtime Publication untuk sinkronisasi instan
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  ALTER PUBLICATION supabase_realtime ADD TABLE waiter_requests;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
