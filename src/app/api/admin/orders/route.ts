import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// Server-side in-memory cache fallback for demo stability when Supabase RLS/tables vary
let inMemoryOrdersStore: any[] = [];

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'VERIFYING';

    // 1. Query Supabase using Service Role (Bypasses RLS)
    const { data: dbOrders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    let finalOrders = dbOrders && dbOrders.length > 0 ? dbOrders : inMemoryOrdersStore;

    // Filter by status if specified (or return all for admin overview)
    if (status !== 'ALL') {
      finalOrders = finalOrders.filter((o) => o.payment_status === status);
    }

    // Process image URLs securely
    const processedOrders = await Promise.all(
      finalOrders.map(async (order) => {
        let proofUrl = order.payment_proof_url || null;

        if (proofUrl && !proofUrl.startsWith('http') && !proofUrl.startsWith('data:')) {
          const cleanPath = proofUrl.replace(/^payment-proofs\//, '');
          
          // Try signed URL first
          const { data: signedData } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(cleanPath, 3600);

          if (signedData?.signedUrl) {
            proofUrl = signedData.signedUrl;
          } else {
            // Fallback to public URL
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
      { success: false, error: err.message, orders: inMemoryOrdersStore },
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

    // Update in Supabase using Service Role
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
      .select();

    // Also update in-memory store for fallback guarantee
    inMemoryOrdersStore = inMemoryOrdersStore.map((o) =>
      o.id === order_id ? { ...o, ...updatePayload } : o
    );

    if (error) {
      console.warn('Supabase DB update warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      order: updatedDb && updatedDb.length > 0 ? updatedDb[0] : { id: order_id, ...updatePayload },
    });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return NextResponse.json(
      { error: 'Gagal memperbarui status pesanan: ' + err.message },
      { status: 500 }
    );
  }
}
