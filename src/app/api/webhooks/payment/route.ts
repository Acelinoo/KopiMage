import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { verifyMidtransSignature } from '@/lib/payment/midtrans';
import { MidtransNotificationPayload } from '@/types/payment';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createAdminSupabaseClient();
  let rawBody: any = null;

  try {
    rawBody = await request.json();
    const payload = rawBody as MidtransNotificationPayload;

    const {
      order_id,
      transaction_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      settlement_time,
    } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { error: 'Payload webhook tidak lengkap.' },
        { status: 400 }
      );
    }

    // 1. Cryptographic SHA-512 Signature Verification with Constant-Time Comparison
    const isValidSignature = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValidSignature) {
      console.warn(`[SECURITY ALERT] Invalid webhook signature received for order_id: ${order_id}`);
      
      // Log invalid attempt for security audit
      await supabase.from('payment_webhook_logs').insert({
        gateway_name: 'MIDTRANS',
        gateway_transaction_id: transaction_id || 'UNKNOWN',
        gateway_order_id: order_id,
        event_type: transaction_status || 'UNKNOWN',
        signature: signature_key,
        payload: rawBody,
        processed_status: 'SIGNATURE_INVALID',
        error_message: 'Cryptographic SHA-512 signature mismatch.',
      });

      return NextResponse.json(
        { error: 'Signature webhook tidak valid.' },
        { status: 403 }
      );
    }

    // 2. Idempotency & Replay Attack Guard
    const { data: existingLog } = await supabase
      .from('payment_webhook_logs')
      .select('id')
      .eq('gateway_transaction_id', transaction_id)
      .eq('event_type', transaction_status)
      .eq('processed_status', 'SUCCESS')
      .maybeSingle();

    if (existingLog) {
      console.log(`[WEBHOOK IDEMPOTENT] Duplicate webhook event ${transaction_status} for transaction ${transaction_id} ignored.`);
      return NextResponse.json({
        success: true,
        message: 'Duplicate notification ignored (already processed).',
      });
    }

    // 3. Map Midtrans Status to KopiMage Payment Status
    let targetPaymentStatus: 'PENDING' | 'SETTLEMENT' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' = 'PENDING';
    let isSettled = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        targetPaymentStatus = 'PAID';
        isSettled = true;
      } else if (fraud_status === 'challenge') {
        targetPaymentStatus = 'PENDING';
      } else {
        targetPaymentStatus = 'FAILED';
      }
    } else if (transaction_status === 'settlement') {
      targetPaymentStatus = 'PAID';
      isSettled = true;
    } else if (transaction_status === 'pending') {
      targetPaymentStatus = 'PENDING';
    } else if (transaction_status === 'expire') {
      targetPaymentStatus = 'EXPIRED';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
      targetPaymentStatus = 'CANCELLED';
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      targetPaymentStatus = 'REFUNDED';
    }

    // 4. Update payments table in PostgreSQL
    const updatePayload: any = {
      status: targetPaymentStatus,
      gateway_transaction_id: transaction_id,
      payment_method: payment_type || 'qris',
      raw_response: rawBody,
      updated_at: new Date().toISOString(),
    };

    if (isSettled) {
      updatePayload.settlement_time = settlement_time || new Date().toISOString();
    }

    const { data: updatedPayment, error: paymentUpdateErr } = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('gateway_order_id', order_id)
      .select('*, orders(*)')
      .maybeSingle();

    if (paymentUpdateErr) {
      console.error('Failed to update payment record:', paymentUpdateErr.message);
      await supabase.from('payment_webhook_logs').insert({
        gateway_name: 'MIDTRANS',
        gateway_transaction_id: transaction_id,
        gateway_order_id: order_id,
        event_type: transaction_status,
        signature: signature_key,
        payload: rawBody,
        processed_status: 'ERROR',
        error_message: paymentUpdateErr.message,
      });

      return NextResponse.json(
        { error: 'Gagal memperbarui status pembayaran: ' + paymentUpdateErr.message },
        { status: 500 }
      );
    }

    // 5. If Payment is Settled/Paid, atomically update orders.payment_status to PAID
    if (isSettled && updatedPayment?.order_id) {
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          payment_status: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedPayment.order_id);

      if (orderUpdateErr) {
        console.error('Failed to update order payment status:', orderUpdateErr.message);
      }
    }

    // 6. Record successful processing into payment_webhook_logs for idempotency
    await supabase.from('payment_webhook_logs').insert({
      gateway_name: 'MIDTRANS',
      gateway_transaction_id: transaction_id,
      gateway_order_id: order_id,
      event_type: transaction_status,
      signature: signature_key,
      payload: rawBody,
      processed_status: 'SUCCESS',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: targetPaymentStatus,
      order_id: updatedPayment?.order_id,
      message: 'Notifikasi pembayaran berhasil diproses.',
    });
  } catch (err: any) {
    console.error('Webhook processing exception:', err);
    return NextResponse.json(
      { error: 'Internal server error saat memproses webhook: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
