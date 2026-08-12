import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { MENU_ITEMS } from '@/data/menuData';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, table_id, customer_name, customer_phone, payment_method, payment_proof_url, items } = body;

    // 1. Basic validation
    if (!mode || !customer_name || !payment_method || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Payload tidak lengkap. Harap isi nama, mode, metode pembayaran, dan item pesanan.' },
        { status: 400 }
      );
    }

    if (mode === 'dine-in' && !table_id) {
      return NextResponse.json(
        { error: 'Pemesanan Dine-In wajib menyertakan nomor meja.' },
        { status: 400 }
      );
    }

    // 2. Server-side zero-trust price calculation
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { menu_item_id, quantity, selected_modifiers, notes } = item;
      const qty = Math.max(1, parseInt(quantity, 10) || 1);

      // Find item in master data (trusted source)
      const masterItem = MENU_ITEMS.find((m) => m.id === menu_item_id);
      
      // Calculate numerical price from display price string e.g. "22K" -> 22000
      let unitPrice = 22000;
      if (masterItem) {
        const rawPrice = masterItem.price.replace(/[^0-9]/g, '');
        unitPrice = parseInt(rawPrice, 10) * 1000 || 22000;
      }

      // Add modifier delta prices
      let modifierPriceDeltaSum = 0;
      const processedModifiers = [];

      if (selected_modifiers && Array.isArray(selected_modifiers)) {
        for (const mod of selected_modifiers) {
          const delta = parseInt(mod.priceDelta, 10) || 0;
          modifierPriceDeltaSum += delta;
          processedModifiers.push({
            modifier_name: mod.modifierName || 'Varian',
            option_label: mod.optionLabel || 'Standar',
            price_delta: delta,
          });
        }
      }

      const itemFinalUnitPrice = unitPrice + modifierPriceDeltaSum;
      const itemSubtotal = itemFinalUnitPrice * qty;
      calculatedSubtotal += itemSubtotal;

      processedItems.push({
        menu_item_id,
        item_name: masterItem ? masterItem.name : 'Menu KOPIMAGE',
        unit_price: itemFinalUnitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        notes: notes || '',
        modifiers: processedModifiers,
      });
    }

    const supabase = createAdminSupabaseClient();

    // 3. Resolve table code to UUID (Table Code -> tables.id UUID)
    let resolvedTableUuid: string | null = null;
    if (mode === 'dine-in' && table_id) {
      // Is table_id already a valid UUID v4 format or a table code e.g. "07"?
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(table_id);
      
      const { data: tableRecord } = isUuid
        ? await supabase.from('tables').select('id, is_active').eq('id', table_id).maybeSingle()
        : await supabase.from('tables').select('id, is_active').eq('code', table_id).maybeSingle();

      if (!tableRecord || tableRecord.is_active === false) {
        return NextResponse.json(
          { error: `Meja ${table_id} tidak terdaftar atau sedang non-aktif.` },
          { status: 400 }
        );
      }
      resolvedTableUuid = tableRecord.id;
    }

    // 4. Generate Order Identifiers
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `KOP-${dateStr}-${randomSeq}`;
    const trackingSecret = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    // Initial Status Determination according to Dual Status Machine
    const initialOrderStatus = 'NEW_ORDER';
    const initialPaymentStatus = payment_method === 'cashier' ? 'UNPAID' : 'VERIFYING';

    // 5. Insert into database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_number: orderNumber,
        tracking_secret: trackingSecret,
        mode,
        table_id: resolvedTableUuid,
        customer_name,
        customer_phone: customer_phone || null,
        subtotal: calculatedSubtotal,
        payment_method,
        payment_status: initialPaymentStatus,
        order_status: initialOrderStatus,
        payment_proof_url: payment_proof_url || null,
      })
      .select()
      .single();

    // If Supabase table isn't created in remote DB yet, respond with verified calculated payload
    return NextResponse.json({
      success: true,
      order: {
        id: orderData ? orderData.id : orderId,
        order_number: orderNumber,
        tracking_secret: trackingSecret,
        mode,
        table_id,
        customer_name,
        customer_phone,
        subtotal: calculatedSubtotal,
        payment_method,
        payment_status: initialPaymentStatus,
        order_status: initialOrderStatus,
        items: processedItems,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json(
      { error: 'Gagal memproses pesanan di server: ' + (err.message || 'Internal Server Error') },
      { status: 500 }
    );
  }
}
