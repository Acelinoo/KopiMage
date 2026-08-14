const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const serverKey = env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-test-dummy-key';

function generateSignature(orderId, statusCode, grossAmount, key) {
  const amountStr = typeof grossAmount === 'number' ? grossAmount.toFixed(2) : grossAmount;
  const raw = `${orderId}${statusCode}${amountStr}${key}`;
  return crypto.createHash('sha512').update(raw).digest('hex');
}

async function runPhaseP3FrontendTests() {
  console.log('========================================================================');
  console.log('🚀 FASE P-3: FRONTEND CUSTOMER CHECKOUT & MIDTRANS SNAP INTEGRATION TEST');
  console.log('========================================================================\n');

  const { data: tableData } = await adminClient.from('tables').select('id, code').eq('code', '01').single();
  const createdOrderIds = [];
  const createdGatewayOrderIds = [];

  try {
    // --------------------------------------------------------------------
    // TEST 1: ONLINE CHECKOUT FLOW (midtrans_online)
    // --------------------------------------------------------------------
    console.log('--- 1. Testing Online Checkout Submission (POST /api/orders) ---');
    const clientOrderIdOnline = crypto.randomUUID();
    const resOrderOnline = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: clientOrderIdOnline,
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Dewi Pelanggan',
        customer_phone: '081298765432',
        payment_method: 'midtrans_online',
        items: [
          {
            menu_item_id: 'kopimage-signature-ice',
            quantity: 2,
            notes: 'Less sugar',
            selected_modifiers: [],
          },
        ],
      }),
    });

    const dataOrderOnline = await resOrderOnline.json();
    console.log('Online Order Creation Response:', resOrderOnline.status, {
      success: dataOrderOnline.success,
      order_id: dataOrderOnline.order?.id,
      order_number: dataOrderOnline.order?.order_number,
      payment_method: dataOrderOnline.order?.payment_method,
      payment_status: dataOrderOnline.order?.payment_status,
    });

    const onlineOrderCreated = resOrderOnline.status === 200 && dataOrderOnline.order?.id;
    if (dataOrderOnline.order?.id) createdOrderIds.push(dataOrderOnline.order.id);

    // --------------------------------------------------------------------
    // TEST 2: SNAP TOKEN CREATION (POST /api/payments/create)
    // --------------------------------------------------------------------
    console.log('\n--- 2. Testing Midtrans Snap Token Initiation for Created Order ---');
    const resSnap = await fetch('http://localhost:3000/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataOrderOnline.order.id,
        payment_method: 'qris',
      }),
    });

    const dataSnap = await resSnap.json();
    console.log('Snap Creation Response:', resSnap.status, {
      success: dataSnap.success,
      has_snap_token: !!dataSnap.snap_token,
      gateway_order_id: dataSnap.gateway_order_id,
      gross_amount: dataSnap.gross_amount,
    });

    const snapTokenPass = resSnap.status === 200 && dataSnap.snap_token && dataSnap.gross_amount > 0;
    if (dataSnap.gateway_order_id) createdGatewayOrderIds.push(dataSnap.gateway_order_id);

    // --------------------------------------------------------------------
    // TEST 3: CASHIER CHECKOUT FLOW (payment_method: cashier)
    // --------------------------------------------------------------------
    console.log('\n--- 3. Testing Cashier Checkout Submission (POST /api/orders) ---');
    const clientOrderIdCashier = crypto.randomUUID();
    const resOrderCashier = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: clientOrderIdCashier,
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Andi Tunai',
        customer_phone: '081211112222',
        payment_method: 'cashier',
        items: [
          {
            menu_item_id: 'manual-brew-v60',
            quantity: 1,
            notes: 'Hot',
            selected_modifiers: [],
          },
        ],
      }),
    });

    const dataOrderCashier = await resOrderCashier.json();
    console.log('Cashier Order Creation Response:', resOrderCashier.status, {
      success: dataOrderCashier.success,
      order_id: dataOrderCashier.order?.id,
      payment_method: dataOrderCashier.order?.payment_method,
      payment_status: dataOrderCashier.order?.payment_status,
    });

    const cashierOrderPass = resOrderCashier.status === 200 && dataOrderCashier.order?.payment_method === 'cashier';
    if (dataOrderCashier.order?.id) createdOrderIds.push(dataOrderCashier.order.id);

    // --------------------------------------------------------------------
    // TEST 4: ORDER TRACKING ENDPOINT (/order/[id])
    // --------------------------------------------------------------------
    console.log('\n--- 4. Testing Order Tracker API Availability ---');
    const resTracker = await fetch(`http://localhost:3000/order/${dataOrderOnline.order.id}`);
    console.log(`Order Tracker Route (/order/[id]) Status: ${resTracker.status} ${resTracker.status === 200 ? '✅' : '❌'}`);
    const trackerPass = resTracker.status === 200;

    // --------------------------------------------------------------------
    // TEST 5: SIMULATING MIDTRANS WEBHOOK SETTLEMENT FOR ONLINE ORDER
    // --------------------------------------------------------------------
    console.log('\n--- 5. Testing Settlement Webhook & Realtime Status Update ---');
    const validSettlementSig = generateSignature(
      dataSnap.gateway_order_id,
      '200',
      `${dataSnap.gross_amount}.00`,
      serverKey
    );

    const resWebhook = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataSnap.gateway_order_id,
        transaction_id: 'TRX-P3-' + Date.now(),
        status_code: '200',
        gross_amount: `${dataSnap.gross_amount}.00`,
        signature_key: validSettlementSig,
        transaction_status: 'settlement',
        payment_type: 'qris',
        settlement_time: new Date().toISOString(),
      }),
    });

    const dataWebhook = await resWebhook.json();
    console.log('Webhook Settlement Response:', resWebhook.status, dataWebhook);

    // Verify DB update
    const { data: dbOrderAfter } = await adminClient
      .from('orders')
      .select('payment_status')
      .eq('id', dataOrderOnline.order.id)
      .single();

    console.log(`Database Verification: orders.payment_status is now -> ${dbOrderAfter?.payment_status}`);
    const webhookSettlementPass = resWebhook.status === 200 && dbOrderAfter?.payment_status === 'PAID';

    // --------------------------------------------------------------------
    // FINAL RESULTS SUMMARY
    // --------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`Online Order Checkout Creation: ${onlineOrderCreated ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Midtrans Snap Token Initiation: ${snapTokenPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Cashier Order Checkout Creation: ${cashierOrderPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Order Tracker Route Availability: ${trackerPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Webhook Settlement & DB Update: ${webhookSettlementPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log('========================================================================\n');
  } finally {
    // Cleanup test artifacts
    console.log('--- Cleaning Up Test Artifacts in PostgreSQL ---');
    if (createdGatewayOrderIds.length > 0) {
      await adminClient.from('payment_webhook_logs').delete().in('gateway_order_id', createdGatewayOrderIds);
    }
    if (createdOrderIds.length > 0) {
      await adminClient.from('payments').delete().in('order_id', createdOrderIds);
      await adminClient.from('order_items').delete().in('order_id', createdOrderIds);
      await adminClient.from('orders').delete().in('id', createdOrderIds);
    }
    console.log('Cleanup completed.\n');
  }
}

runPhaseP3FrontendTests().catch(console.error);
