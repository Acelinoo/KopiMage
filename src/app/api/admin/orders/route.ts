import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  getOrdersFromStore,
  updateOrderInStore,
  updateOrderInStoreConditional,
  clearOrdersStore,
  OrderRecord,
} from '@/lib/ordersStore';

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
    const memoryMap = new Map(memoryOrders.map((o) => [o.id, o]));

    // Combine DB orders with memory orders, prioritizing whichever has the newest updated_at timestamp
    const combinedOrders: OrderRecord[] = (dbOrders || []).map((dbOrder: any) => {
      const memOrder = memoryMap.get(dbOrder.id);
      if (memOrder) {
        const dbTime = new Date(dbOrder.updated_at || dbOrder.created_at || 0).getTime();
        const memTime = new Date(memOrder.updated_at || memOrder.created_at || 0).getTime();
        if (memTime > dbTime) {
          return {
            ...dbOrder,
            ...memOrder,
            order_items: dbOrder.order_items || memOrder.order_items || memOrder.items || [],
          };
        }
      }
      return dbOrder;
    });

    // Add memory orders not yet in DB
    memoryOrders.forEach((memOrder) => {
      if (!dbOrderIds.has(memOrder.id)) {
        combinedOrders.push(memOrder);
      }
    });

    // Normalize item fields (ensure both items and order_items are set)
    let finalOrders = combinedOrders.map((order: any) => {
      let itemsList: any[] = [];
      if (Array.isArray(order.order_items) && order.order_items.length > 0) {
        itemsList = order.order_items;
      } else if (Array.isArray(order.items) && order.items.length > 0) {
        itemsList = order.items;
      } else if (typeof order.items === 'string') {
        try {
          itemsList = JSON.parse(order.items);
        } catch (e) {}
      } else if (typeof order.order_items === 'string') {
        try {
          itemsList = JSON.parse(order.order_items);
        } catch (e) {}
      }

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
    const {
      order_id,
      payment_status,
      order_status,
      expected_current_status,
      rejection_reason,
      cancellation_reason,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Fetch current order state to enforce strict cancellation & transition rules
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('order_status, payment_status')
      .eq('id', order_id)
      .maybeSingle();

    if (currentOrder) {
      // Rule 1: COMPLETED orders CANNOT be directly cancelled
      if (order_status === 'CANCELLED' && currentOrder.order_status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Pesanan yang sudah selesai disajikan (COMPLETED) tidak dapat langsung dibatalkan.' },
          { status: 400 }
        );
      }

      // Rule 2: Concurrency Lock Check if expected_current_status is provided
      if (expected_current_status && currentOrder.order_status !== expected_current_status) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pesanan ini sudah diambil oleh waiter lain atau status telah berubah.',
            code: 'CONCURRENCY_CONFLICT',
            current_status: currentOrder.order_status,
          },
          { status: 409 }
        );
      }
    }

    // Update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (payment_status) {
      updatePayload.payment_status = payment_status;
    }

    if (order_status) {
      updatePayload.order_status = order_status;

      // Rule 3: If a PAID order is cancelled, set payment_status to REFUND_REQUIRED
      if (order_status === 'CANCELLED' && (currentOrder?.payment_status === 'PAID' || payment_status === 'PAID')) {
        updatePayload.payment_status = 'REFUND_REQUIRED';
      }
    }

    if (rejection_reason !== undefined) {
      updatePayload.rejection_reason = rejection_reason;
    }

    if (cancellation_reason !== undefined) {
      updatePayload.cancellation_reason = cancellation_reason;
    }

    // 2. Atomic Database Query execution (Single Source of Truth)
    let dbQuery = supabase.from('orders').update(updatePayload).eq('id', order_id);
    if (expected_current_status) {
      dbQuery = dbQuery.eq('order_status', expected_current_status);
    }
    const { data: updatedDb, error } = await dbQuery.select('*, order_items(*)');

    // If expected_current_status was required and PostgreSQL updated 0 rows -> 409 CONFLICT
    if (expected_current_status && (!updatedDb || updatedDb.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pesanan ini sudah diambil oleh waiter lain atau status telah berubah.',
          code: 'CONCURRENCY_CONFLICT',
          current_status: currentOrder?.order_status,
        },
        { status: 409 }
      );
    }

    // 3. Synchronize status update to memory store mirror
    let updatedInMemory: any = null;
    if (expected_current_status) {
      const memoryResult = updateOrderInStoreConditional(order_id, updatePayload, expected_current_status);
      updatedInMemory = memoryResult.order;
    } else {
      updatedInMemory = updateOrderInStore(order_id, updatePayload);
    }

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

export async function DELETE(request: Request) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const isAll = searchParams.get('all') === 'true';

    if (isAll) {
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      clearOrdersStore();

      return NextResponse.json({
        success: true,
        message: 'Semua pesanan telah berhasil dihapus.',
      });
    }

    if (orderId) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({
        success: true,
        message: 'Pesanan telah berhasil dihapus.',
      });
    }

    return NextResponse.json({ error: 'Harap tentukan id atau parameter all=true.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error deleting orders:', err);
    return NextResponse.json(
      { error: 'Gagal menghapus pesanan: ' + err.message },
      { status: 500 }
    );
  }
}

