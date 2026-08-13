import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getOrdersFromStore, updateOrderInStore, OrderRecord } from '@/lib/ordersStore';

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    // 1. Query Supabase with order_items joined
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase orders fetch warning:', error.message);
    }

    // 2. Merge database orders with in-memory shared store orders
    const memoryOrders = getOrdersFromStore();
    const dbOrderIds = new Set((dbOrders || []).map((o) => o.id));

    // Combine DB orders with memory orders not yet in DB
    const combinedOrders: OrderRecord[] = [
      ...(dbOrders || []),
      ...memoryOrders.filter((o) => !dbOrderIds.has(o.id)),
    ];

    // Normalize item fields (ensure both items and order_items are set)
    let finalOrders = combinedOrders.map((order: any) => {
      const itemsList = order.order_items || order.items || [];
      return {
        ...order,
        items: itemsList,
        order_items: itemsList,
      };
    });

    // Sort descending by created_at
    finalOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter by status if requested
    if (status !== 'ALL') {
      if (status === 'VERIFYING') {
        // 'VERIFYING' tab includes both online proof verification (VERIFYING) and Cashier payment pending (UNPAID)
        finalOrders = finalOrders.filter(
          (o) => o.payment_status === 'VERIFYING' || o.payment_status === 'UNPAID'
        );
      } else {
        finalOrders = finalOrders.filter((o) => o.payment_status === status);
      }
    }

    // Process image URLs securely
    const processedOrders = await Promise.all(
      finalOrders.map(async (order) => {
        let proofUrl = order.payment_proof_url || null;

        if (proofUrl && !proofUrl.startsWith('http') && !proofUrl.startsWith('data:')) {
          const cleanPath = proofUrl.replace(/^payment-proofs\//, '');
          
          const { data: signedData } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(cleanPath, 3600);

          if (signedData?.signedUrl) {
            proofUrl = signedData.signedUrl;
          } else {
            const { data: publicData } = supabase.storage
              .from('payment-proofs')
              .getPublicUrl(cleanPath);
            proofUrl = publicData.publicUrl;
          }
        }

        return {
          ...order,
          payment_proof_url: proofUrl,
        };
      })
    );

    return NextResponse.json({ success: true, orders: processedOrders });
  } catch (err: any) {
    console.error('Error fetching admin orders:', err);
    return NextResponse.json(
      { success: false, error: err.message, orders: getOrdersFromStore() },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_id, payment_status, order_status, rejection_reason } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (payment_status) {
      updatePayload.payment_status = payment_status;
    }

    if (order_status) {
      updatePayload.order_status = order_status;
    }

    if (rejection_reason !== undefined) {
      updatePayload.rejection_reason = rejection_reason;
    }

    // If approving payment and no specific order_status sent, default to PREPARING
    if (payment_status === 'PAID' && !order_status) {
      updatePayload.order_status = 'PREPARING';
    }

    const { data: updatedDb, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order_id)
      .select('*, order_items(*)');

    // Synchronize status update to memory store
    const updatedInMemory = updateOrderInStore(order_id, updatePayload);

    if (error) {
      console.warn('Supabase DB update warning:', error.message);
    }

    const returnOrder =
      updatedDb && updatedDb.length > 0
        ? {
            ...updatedDb[0],
            items: updatedDb[0].order_items || updatedDb[0].items || [],
            order_items: updatedDb[0].order_items || updatedDb[0].items || [],
          }
        : updatedInMemory || { id: order_id, ...updatePayload };

    return NextResponse.json({
      success: true,
      order: returnOrder,
    });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return NextResponse.json(
      { error: 'Gagal memperbarui status pesanan: ' + err.message },
      { status: 500 }
    );
  }
}

