import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createMidtransSnapTransaction } from '@/lib/payment/midtrans';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, payment_method } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID wajib disertakan.' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Fetch Authoritative Order Data from PostgreSQL (Single Source of Truth)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    // 2. Validate Order State
    if (order.payment_status === 'PAID') {
      return NextResponse.json(
        { error: 'Pesanan ini sudah lunas (PAID).' },
        { status: 400 }
      );
    }

    if (order.order_status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Pesanan ini telah dibatalkan.' },
        { status: 400 }
      );
    }

    // 3. Extract Authoritative Amount from PostgreSQL Database (Zero-Trust)
    const grossAmount = Math.round(Number(order.subtotal || order.total_amount || 0));
    if (grossAmount <= 0) {
      return NextResponse.json(
        { error: 'Nominal pesanan tidak valid untuk pembayaran.' },
        { status: 400 }
      );
    }

    // 4. Generate Unique Gateway Order ID for this payment attempt
    const attemptSeq = Date.now().toString().slice(-4);
    const gatewayOrderId = `${order.order_number}-${attemptSeq}`;

    // Format item details from authoritative order_items table
    const items = Array.isArray(order.order_items) && order.order_items.length > 0
      ? order.order_items.map((it: any) => ({
          id: it.id || it.item_name,
          name: it.item_name,
          price: Math.round(Number(it.unit_price || it.subtotal / it.quantity)),
          quantity: Math.max(1, it.quantity),
        }))
      : [
          {
            id: order.id,
            name: `Pesanan ${order.order_number}`,
            price: grossAmount,
            quantity: 1,
          },
        ];

    // 5. Call Midtrans Snap Transaction API
    const { snapToken, redirectUrl } = await createMidtransSnapTransaction({
      gatewayOrderId,
      grossAmount,
      customerName: order.customer_name || 'Pelanggan KopiMage',
      customerPhone: order.customer_phone || '',
      items,
    });

    const paymentId = crypto.randomUUID();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // 6. Record Payment Session into payments table in PostgreSQL
    const { data: paymentRecord, error: insertPaymentErr } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        order_id: order.id,
        gateway_name: 'MIDTRANS',
        gateway_order_id: gatewayOrderId,
        payment_method: payment_method || 'qris',
        gross_amount: grossAmount,
        currency: 'IDR',
        status: 'PENDING',
        snap_token: snapToken,
        payment_url: redirectUrl,
        expiry_time: expiryTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertPaymentErr) {
      console.error('Failed to insert payment record into PostgreSQL:', insertPaymentErr.message);
      return NextResponse.json(
        { error: 'Gagal mencatat transaksi pembayaran ke database: ' + insertPaymentErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: paymentRecord,
      snap_token: snapToken,
      redirect_url: redirectUrl,
      gateway_order_id: gatewayOrderId,
      gross_amount: grossAmount,
    });
  } catch (err: any) {
    console.error('Error creating payment session:', err);
    return NextResponse.json(
      { error: 'Gagal membuat sesi pembayaran: ' + (err.message || 'Server error') },
      { status: 500 }
    );
  }
}
