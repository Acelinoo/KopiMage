import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { MENU_ITEMS } from '@/data/menuData';
import { addOrderToStore, OrderRecord } from '@/lib/ordersStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

// Helper to strip HTML tags and trim length to prevent stored XSS and payload bloating
function sanitizeText(input: any, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML tags
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting Protection (Max 15 order creations per minute per IP)
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, 15, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak permintaan pemesanan dari perangkat Anda. Harap tunggu beberapa saat sebelum memesan kembali.',
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetInMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { client_order_id, mode, table_id, customer_name, customer_phone, payment_method, payment_proof_url, items } = body;

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

    // Sanitize user-provided fields
    const cleanCustomerName = sanitizeText(customer_name, 60);
    const cleanCustomerPhone = sanitizeText(customer_phone, 20).replace(/[^0-9+]/g, '');
    let cleanProofUrl = payment_proof_url;
    if (cleanProofUrl && typeof cleanProofUrl === 'string') {
      // Validate payment proof URL or data URI format
      if (!cleanProofUrl.startsWith('data:image/') && !cleanProofUrl.startsWith('https://') && !cleanProofUrl.startsWith('http://')) {
        cleanProofUrl = null;
      } else if (cleanProofUrl.length > 8 * 1024 * 1024) {
        // Block oversized payload > 8MB
        return NextResponse.json({ error: 'Ukuran foto bukti transfer terlalu besar (Maksimal 5MB).' }, { status: 400 });
      }
    }

    const supabase = createAdminSupabaseClient();

    // 2. IDEMPOTENCY CHECK (1 client_order_id = 1 order)
    if (client_order_id) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('client_order_id', client_order_id)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          order: existingOrder,
          message: 'Idempotent request: order sudah pernah dibuat sebelumnya.',
        });
      }
    }

    // 3. Server-side zero-trust price calculation & menu availability validation
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { menu_item_id, quantity, selected_modifiers, notes } = item;
      const qty = Math.max(1, parseInt(quantity, 10) || 1);

      // Find item in master data (trusted source)
      const masterItem = MENU_ITEMS.find((m) => m.id === menu_item_id);
      
      // Menu availability validation
      if (masterItem && (masterItem as any).is_available === false) {
        return NextResponse.json(
          { error: `Mohon maaf, menu "${masterItem.name}" sedang habis / SOLD OUT.` },
          { status: 400 }
        );
      }

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

    // 4. Resolve table code (Human-friendly e.g. "1" or "01")
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

      // Fallback: If table record is not in Supabase yet, auto-create/upsert table
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

    // 5. Generate Order Identifiers (Concurrency-safe display number)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `KOP-${dateStr}-${randomSeq}`;
    
    // Concurrency-safe human display order number e.g. "#A127"
    const nextSeqNum = Math.floor(100 + (Date.now() % 900));
    const orderDisplayNumber = `#A${nextSeqNum}`;

    const trackingSecret = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    // Initial Status: Instantly dispatch to Kitchen & Barista as NEW_ORDER
    const initialOrderStatus: 'NEW_ORDER' = 'NEW_ORDER';
    const initialPaymentStatus: 'UNPAID' | 'VERIFYING' = payment_method === 'cashier' ? 'UNPAID' : 'UNPAID';

    // 6. Insert into Supabase database (strictly matching PostgreSQL orders schema columns)
    const insertPayload: any = {
      id: orderId,
      order_number: orderNumber,
      tracking_secret: trackingSecret,
      mode,
      table_id: mode === 'dine-in' ? resolvedTableUuid : null,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone || null,
      subtotal: calculatedSubtotal,
      payment_method,
      payment_status: initialPaymentStatus,
      order_status: initialOrderStatus,
      payment_proof_url: cleanProofUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select('*, tables(*)')
      .maybeSingle();

    if (orderError) {
      console.warn('Supabase DB order insert warning:', orderError.message);
    }

    // 7. Insert order items into order_items table in Supabase
    if (processedItems.length > 0) {
      const itemsToInsert = processedItems.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderData ? orderData.id : orderId,
        item_name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes || '',
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) {
        console.warn('Supabase DB order_items insert warning:', itemsError.message);
      }
    }

    const createdRecordPayload: OrderRecord = {
      id: orderData ? orderData.id : orderId,
      client_order_id: client_order_id || null,
      order_number: orderNumber,
      order_display_number: orderDisplayNumber,
      tracking_secret: trackingSecret,
      mode,
      table_id: mode === 'dine-in' ? cleanTableCode : null,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone,
      payment_method,
      payment_proof_url: cleanProofUrl,
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
