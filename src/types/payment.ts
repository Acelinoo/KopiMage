export type PaymentGatewayStatus =
  | 'PENDING'
  | 'SETTLEMENT'
  | 'PAID'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethodType =
  | 'qris'
  | 'gopay'
  | 'shopeepay'
  | 'bca_va'
  | 'bni_va'
  | 'bri_va'
  | 'mandiri_bill'
  | 'permata_va'
  | 'cashier'
  | 'bank_transfer_manual'
  | 'qris_manual';

export interface PaymentRecord {
  id: string;
  order_id: string;
  gateway_name: 'MIDTRANS' | string;
  gateway_transaction_id: string | null;
  gateway_order_id: string;
  payment_method: string;
  gross_amount: number;
  currency: string;
  status: PaymentGatewayStatus;
  snap_token?: string | null;
  payment_url?: string | null;
  qr_code_url?: string | null;
  va_number?: string | null;
  bank_name?: string | null;
  settlement_time?: string | null;
  expiry_time?: string | null;
  raw_response?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWebhookLogRecord {
  id: string;
  gateway_name: string;
  gateway_transaction_id: string;
  gateway_order_id: string;
  event_type?: string | null;
  signature?: string | null;
  payload: Record<string, any>;
  processed_status: 'SUCCESS' | 'IGNORED_DUPLICATE' | 'SIGNATURE_INVALID' | 'ERROR';
  error_message?: string | null;
  created_at: string;
}

export interface MidtransNotificationPayload {
  order_id: string;
  transaction_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status:
    | 'capture'
    | 'settlement'
    | 'pending'
    | 'deny'
    | 'cancel'
    | 'expire'
    | 'refund'
    | 'partial_refund'
    | 'authorize';
  payment_type: string;
  fraud_status?: 'accept' | 'challenge' | 'deny';
  settlement_time?: string;
  transaction_time?: string;
  currency?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  bca_va_number?: string;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}

export interface CreatePaymentSessionParams {
  orderId: string;
  orderNumber: string;
  grossAmount: number;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface CreatePaymentSessionResult {
  success: boolean;
  paymentId: string;
  gatewayOrderId: string;
  snapToken: string;
  redirectUrl: string;
  error?: string;
}
