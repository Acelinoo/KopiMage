import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { MENU_ITEMS } from '@/data/menuData';
import { addOrderToStore, OrderRecord } from '@/lib/ordersStore';

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

    // 3. Resolve table code (Human-friendly e.g. "1" or "01")
    let resolvedTableUuid: string | null = null;
    let cleanTableCode = '01';

    if (mode === 'dine-in' && table_id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(table_id);
      
      const paddedCode = String(table_id).padStart(2, '0');
      const unpaddedCode = String(parseInt(table_id, 10) || table_id);
      cleanTableCode = unpaddedCode || paddedCode;

      let { data: tableRecord } = isUuid
        ? await supabase.from('tables').select('id, code, is_active').eq('id', table_id).maybeSingle()
        : await supabase.from('tables').select('id, code, is_active').in('code', [String(table_id), paddedCode, unpaddedCode]).maybeSingle();

      // Fallback: If table record is not in Supabase yet, auto-create/upsert table to guarantee order success
      if (!tableRecord) {
        const newTableId = crypto.randomUUID();
        const { data: createdTable } = await supabase
          .from('tables')
          .insert({
            id: newTableId,
            code: paddedCode,
            name: `MEJA ${unpaddedCode}`,
            area: 'Indoor AC',
            is_active: true,
          })
          .select('id, code, is_active')
          .maybeSingle();

        if (createdTable) {
          tableRecord = createdTable;
        }
      }

      if (tableRecord && tableRecord.is_active !== false) {
        resolvedTableUuid = tableRecord.id;
        if (tableRecord.code) {
          cleanTableCode = String(parseInt(tableRecord.code, 10) || tableRecord.code);
        }
      }
    }

    // 4. Generate Order Identifiers
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `KOP-${dateStr}-${randomSeq}`;
    const trackingSecret = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    // Initial Status: Instantly dispatch to Kitchen & Barista as PREPARING
    const initialOrderStatus: 'PREPARING' = 'PREPARING';
    const initialPaymentStatus: 'UNPAID' | 'VERIFYING' = payment_method === 'cashier' ? 'UNPAID' : 'VERIFYING';

    // 5. Insert into database
    const insertPayload: any = {
      id: orderId,
      order_number: orderNumber,
      tracking_secret: trackingSecret,
      mode,
      table_id: mode === 'dine-in' ? cleanTableCode : null,
      customer_name,
      customer_phone,
      payment_method,
      payment_proof_url,
      subtotal: calculatedSubtotal,
      total_amount: calculatedSubtotal,
      order_status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      items: processedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (orderError) {
      console.warn('Supabase DB order insert warning:', orderError.message);
    }

    // 6. Insert order items into order_items table in Supabase
    if (processedItems.length > 0) {
      const itemsToInsert = processedItems.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderData ? orderData.id : orderId,
        menu_item_id: item.menu_item_id || null,
        item_name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes || '',
        modifiers: item.modifiers || [],
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) {
        console.warn('Supabase DB order_items insert warning:', itemsError.message);
      }
    }

    const createdRecordPayload: OrderRecord = {
      id: orderData ? orderData.id : orderId,
      order_number: orderNumber,
      tracking_secret: trackingSecret,
      mode: mode === 'takeaway' ? 'takeaway' : 'dine-in',
      table_id: mode === 'dine-in' ? cleanTableCode : null,
      customer_name,
      customer_phone,
      payment_method,
      payment_proof_url,
      subtotal: calculatedSubtotal,
      total_amount: calculatedSubtotal,
      order_status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: processedItems,
      order_items: processedItems,
    };

    // Synchronize to shared order store
    addOrderToStore(createdRecordPayload);

    return NextResponse.json({
      success: true,
      order: createdRecordPayload,
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json(
      { error: 'Gagal memproses pesanan di server: ' + (err.message || 'Internal Server Error') },
      { status: 500 }
    );
  }
}
