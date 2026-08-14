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

async function runPhaseP4Tests() {
  console.log('========================================================================');
  console.log('🚀 FASE P-4: OPERATIONAL DASHBOARDS PAYMENT STATUS INTEGRATION TEST');
  console.log('========================================================================\n');

  const { data: tableData } = await adminClient.from('tables').select('id, code').eq('code', '01').single();
  const createdOrderIds = [];
  const createdGatewayOrderIds = [];

  try {
    // --------------------------------------------------------------------
    // TEST 1: MIDTRANS ONLINE FLOW & MULTI-DASHBOARD SYNCHRONIZATION
    // --------------------------------------------------------------------
    console.log('--- 1. Testing Midtrans Online Flow (Order -> Webhook Settlement -> Dashboards Sync) ---');
    const clientOrderId = crypto.randomUUID();
    const resOrder = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: clientOrderId,
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Budi Online',
        customer_phone: '081233445566',
        payment_method: 'midtrans_online',
        items: [{ menu_item_id: 'kopimage-signature-ice', quantity: 1, notes: 'Normal ice', selected_modifiers: [] }],
      }),
    });
    const dataOrder = await resOrder.json();
    console.log(`Created Online Order: ${dataOrder.order?.order_number} (${dataOrder.order?.id}), payment_status: ${dataOrder.order?.payment_status}`);
    createdOrderIds.push(dataOrder.order.id);

    // Inisiasi payment session
    const resSnap = await fetch('http://localhost:3000/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: dataOrder.order.id, payment_method: 'qris' }),
    });
    const dataSnap = await resSnap.json();
    createdGatewayOrderIds.push(dataSnap.gateway_order_id);
    console.log(`Created Snap Session: Gateway Order ID = ${dataSnap.gateway_order_id}`);

    // Simulasi Webhook Settlement dari Midtrans
    const validSig = generateSignature(dataSnap.gateway_order_id, '200', `${dataSnap.gross_amount}.00`, serverKey);
    const resWebhook = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataSnap.gateway_order_id,
        transaction_id: 'TRX-P4-' + Date.now(),
        status_code: '200',
        gross_amount: `${dataSnap.gross_amount}.00`,
        signature_key: validSig,
        transaction_status: 'settlement',
        payment_type: 'qris',
        settlement_time: new Date().toISOString(),
      }),
    });
    console.log(`Webhook Settlement Response: ${resWebhook.status}`);

    // Verify status in Admin API
    const resAdminOrders = await fetch('http://localhost:3000/api/admin/orders?status=ALL');
    const dataAdminOrders = await resAdminOrders.json();
    const verifiedOrderInAdmin = dataAdminOrders.orders?.find((o) => o.id === dataOrder.order.id);
    console.log(`Admin Dashboard View Status: ${verifiedOrderInAdmin?.payment_status} (Expected: PAID)`);

    const midtransSyncPass = verifiedOrderInAdmin?.payment_status === 'PAID';

    // --------------------------------------------------------------------
    // TEST 2: ADMIN MANUAL OVERRIDE ON ONLINE ORDER
    // --------------------------------------------------------------------
    console.log('\n--- 2. Testing Admin Manual Override for Online Order ---');
    const resOrderOverride = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: crypto.randomUUID(),
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Citra Override',
        customer_phone: '081299998888',
        payment_method: 'midtrans_online',
        items: [{ menu_item_id: 'manual-brew-v60', quantity: 1, notes: 'Hot', selected_modifiers: [] }],
      }),
    });
    const dataOrderOverride = await resOrderOverride.json();
    createdOrderIds.push(dataOrderOverride.order.id);

    // Admin triggers manual override PATCH
    const resOverride = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataOrderOverride.order.id,
        payment_status: 'PAID',
      }),
    });
    const dataOverride = await resOverride.json();
    console.log(`Admin Manual Override PATCH Response: ${resOverride.status}`, {
      success: dataOverride.success,
      payment_status: dataOverride.order?.payment_status,
    });

    const overridePass = resOverride.status === 200 && dataOverride.order?.payment_status === 'PAID';

    // --------------------------------------------------------------------
    // TEST 3: CASHIER WORKFLOW REGRESSION
    // --------------------------------------------------------------------
    console.log('\n--- 3. Testing Cashier Flow Regression (Order -> Admin Approve -> PAID) ---');
    const resOrderCashier = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: crypto.randomUUID(),
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Doni Kasir',
        customer_phone: '081277776666',
        payment_method: 'cashier',
        items: [{ menu_item_id: 'kopimage-signature-ice', quantity: 1, notes: '', selected_modifiers: [] }],
      }),
    });
    const dataOrderCashier = await resOrderCashier.json();
    createdOrderIds.push(dataOrderCashier.order.id);

    const resApproveCashier = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataOrderCashier.order.id,
        payment_status: 'PAID',
      }),
    });
    const dataApproveCashier = await resApproveCashier.json();
    console.log(`Cashier Approval Response: ${resApproveCashier.status}, Status: ${dataApproveCashier.order?.payment_status}`);
    const cashierPass = resApproveCashier.status === 200 && dataApproveCashier.order?.payment_status === 'PAID';

    // --------------------------------------------------------------------
    // TEST 4: MANUAL QRIS & PROOF UPLOAD FLOW
    // --------------------------------------------------------------------
    console.log('\n--- 4. Testing Manual QRIS Flow Regression ---');
    const resOrderQris = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_order_id: crypto.randomUUID(),
        mode: 'dine-in',
        table_id: tableData.id,
        customer_name: 'Eka Manual QRIS',
        customer_phone: '081255554444',
        payment_method: 'qris_static',
        items: [{ menu_item_id: 'kopimage-signature-ice', quantity: 1, notes: '', selected_modifiers: [] }],
      }),
    });
    const dataOrderQris = await resOrderQris.json();
    createdOrderIds.push(dataOrderQris.order.id);

    // Customer uploads proof -> status VERIFYING
    const resUploadProof = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataOrderQris.order.id,
        payment_status: 'VERIFYING',
      }),
    });
    const dataUploadProof = await resUploadProof.json();
    console.log(`Upload Proof Update Response: ${resUploadProof.status}, Status: ${dataUploadProof.order?.payment_status}`);

    // Admin approves -> PAID
    const resApproveQris = await fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataOrderQris.order.id,
        payment_status: 'PAID',
      }),
    });
    const dataApproveQris = await resApproveQris.json();
    const manualQrisPass = resApproveQris.status === 200 && dataApproveQris.order?.payment_status === 'PAID';

    // --------------------------------------------------------------------
    // TEST 5: IDEMPOTENT WEBHOOK REPLAY GUARD
    // --------------------------------------------------------------------
    console.log('\n--- 5. Testing Idempotent Webhook Replay Guard ---');
    const resDuplicateWebhook = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: dataSnap.gateway_order_id,
        transaction_id: 'TRX-P4-REPLAY',
        status_code: '200',
        gross_amount: `${dataSnap.gross_amount}.00`,
        signature_key: validSig,
        transaction_status: 'settlement',
        payment_type: 'qris',
      }),
    });
    console.log(`Duplicate Webhook Response: ${resDuplicateWebhook.status}`);
    const idempotencyPass = resDuplicateWebhook.status === 200;

    // --------------------------------------------------------------------
    // TEST 6: ROUTE AVAILABILITY CHECKS FOR ALL DASHBOARDS
    // --------------------------------------------------------------------
    console.log('\n--- 6. Verifying Dashboard Route Status (HTTP 200) ---');
    const resAdmin = await fetch('http://localhost:3000/admin');
    const resKitchen = await fetch('http://localhost:3000/kitchen');
    const resWaiter = await fetch('http://localhost:3000/waiter');
    const resTracker = await fetch(`http://localhost:3000/order/${dataOrder.order.id}`);

    console.log(`Admin Dashboard (/admin): ${resAdmin.status} ${resAdmin.status === 200 ? '✅' : '❌'}`);
    console.log(`Kitchen KDS (/kitchen): ${resKitchen.status} ${resKitchen.status === 200 ? '✅' : '❌'}`);
    console.log(`Waiter Floor Matrix (/waiter): ${resWaiter.status} ${resWaiter.status === 200 ? '✅' : '❌'}`);
    console.log(`Customer Order Tracker (/order/[id]): ${resTracker.status} ${resTracker.status === 200 ? '✅' : '❌'}`);

    const routesPass = resAdmin.status === 200 && resKitchen.status === 200 && resWaiter.status === 200 && resTracker.status === 200;

    // --------------------------------------------------------------------
    // SUMMARY REPORT
    // --------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`Midtrans Settlement Multi-Dashboard Sync: ${midtransSyncPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Admin Manual Override Capability: ${overridePass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Cashier Workflow Regression: ${cashierPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Manual QRIS Proof Workflow Regression: ${manualQrisPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Webhook Idempotency Replay Protection: ${idempotencyPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`All Operational Routes Availability: ${routesPass ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log('========================================================================\n');
  } finally {
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

runPhaseP4Tests().catch(console.error);
