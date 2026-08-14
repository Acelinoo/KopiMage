-- ====================================================================
-- KOPIMAGE PAYMENT GATEWAY FOUNDATION MIGRATION (FASE P-1)
-- Target: Supabase PostgreSQL
-- ====================================================================

-- 1. Buat Enum Status Payment Gateway
DO $$ BEGIN
  CREATE TYPE payment_gateway_status_enum AS ENUM (
    'PENDING',
    'SETTLEMENT',
    'PAID',
    'EXPIRED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Buat Tabel payments Terpisah (1 Order -> Many Payment Attempts)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  gateway_name TEXT NOT NULL DEFAULT 'MIDTRANS',
  gateway_transaction_id TEXT UNIQUE,
  gateway_order_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  gross_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status payment_gateway_status_enum NOT NULL DEFAULT 'PENDING',
  snap_token TEXT,
  payment_url TEXT,
  qr_code_url TEXT,
  va_number TEXT,
  bank_name TEXT,
  settlement_time TIMESTAMPTZ,
  expiry_time TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Buat Tabel payment_webhook_logs (Audit Trail, Idempotency, & Replay Guard)
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL DEFAULT 'MIDTRANS',
  gateway_transaction_id TEXT NOT NULL,
  gateway_order_id TEXT NOT NULL,
  event_type TEXT,
  signature TEXT,
  payload JSONB NOT NULL,
  processed_status TEXT NOT NULL, -- 'SUCCESS', 'IGNORED_DUPLICATE', 'SIGNATURE_INVALID', 'ERROR'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Buat Indeks Performa untuk Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_trans_id ON payments(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_trans_id ON payment_webhook_logs(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_order_id ON payment_webhook_logs(gateway_order_id);

-- 5. Trigger Otomatis updated_at Timestamp pada Tabel payments
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view payments" ON payments;
DROP POLICY IF EXISTS "Public can view payment webhook logs" ON payment_webhook_logs;

-- Policy A: SELECT diizinkan untuk Public/Anon pada payments (Wajib agar Realtime WebSocket Engine dapat mengirim update ke customer)
CREATE POLICY "Public can view payments"
ON payments FOR SELECT
USING (true);

-- Policy B: payment_webhook_logs TIDAK memiliki policy public SELECT/INSERT/UPDATE (Hanya Service Role yang dapat mengakses)

-- 7. Daftarkan Tabel payments ke Supabase Realtime Publication secara Idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;
END $$;
