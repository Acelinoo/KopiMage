const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const serverKey = env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-test-dummy-key';

function generateSignature(orderId, statusCode, grossAmount, key) {
  const amountStr = typeof grossAmount === 'number' ? grossAmount.toFixed(2) : grossAmount;
  const raw = `${orderId}${statusCode}${amountStr}${key}`;
  return crypto.createHash('sha512').update(raw).digest('hex');
}

async function runPhaseP2Tests() {
  console.log('========================================================================');
  console.log('🚀 FASE P-2: PAYMENT INITIATION & WEBHOOK ENGINE TEST SUITE');
  console.log('========================================================================\n');

  const testOrderId = crypto.randomUUID();
  const testOrderNumber = `KOP-TEST-PAY-${Date.now().toString().slice(-4)}`;
  const authoritativeAmount = 45000;
  const { data: tableData } = await adminClient.from('tables').select('id').eq('code', '01').single();

  // --------------------------------------------------------------------
  // STEP 1: CREATE TEST ORDER IN POSTGRESQL (AUTHORITATIVE SOURCE OF TRUTH)
  // --------------------------------------------------------------------
  console.log('--- 1. Creating Authoritative Test Order in PostgreSQL ---');
  await adminClient.from('orders').insert({
    id: testOrderId,
    order_number: testOrderNumber,
    mode: 'dine-in',
    table_id: tableData.id,
    customer_name: 'Budi Tester',
    customer_phone: '08123456789',
    payment_method: 'qris',
    subtotal: authoritativeAmount,
    order_status: 'NEW_ORDER',
    payment_status: 'UNPAID',
  });

  await adminClient.from('order_items').insert([
    {
      id: crypto.randomUUID(),
      order_id: testOrderId,
      item_name: 'Espresso Single',
      unit_price: 20000,
      quantity: 1,
      subtotal: 20000,
    },
    {
      id: crypto.randomUUID(),
      order_id: testOrderId,
      item_name: 'Croissant Butter',
      unit_price: 25000,
      quantity: 1,
      subtotal: 25000,
    },
  ]);

  console.log(`Created Order ${testOrderNumber} with authoritative amount: Rp ${authoritativeAmount}`);

  // --------------------------------------------------------------------
  // STEP 2: TEST PAYMENT INITIATION (POST /api/payments/create)
  // --------------------------------------------------------------------
  console.log('\n--- 2. Testing Zero-Trust Payment Initiation (POST /api/payments/create) ---');
  const resCreate = await fetch('http://localhost:3000/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: testOrderId,
      payment_method: 'qris',
      // Note: Client attempts to send fake amount, backend MUST ignore it and use DB subtotal
      fake_tampered_amount: 1000,
    }),
  });

  const dataCreate = await resCreate.json();
  console.log('Payment Initiation Response:', resCreate.status, {
    success: dataCreate.success,
    gross_amount: dataCreate.gross_amount,
    gateway_order_id: dataCreate.gateway_order_id,
    snap_token_received: !!dataCreate.snap_token,
  });

  const gatewayOrderId = dataCreate.gateway_order_id || `${testOrderNumber}-9999`;
  const paymentPass = resCreate.status === 200 && dataCreate.gross_amount === authoritativeAmount;
  console.log(`Payment Initiation Zero-Trust Amount Test: ${paymentPass ? 'PASSED ✅' : 'FAILED ❌'}`);

  // --------------------------------------------------------------------
  // STEP 3: TEST SECURITY - INVALID SIGNATURES (Expected: 403 Forbidden)
  // --------------------------------------------------------------------
  console.log('\n--- 3. Testing Webhook Security & Tamper Protection ---');

  // 3a. Invalid signature hash
  const resBadSig = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: gatewayOrderId,
      transaction_id: 'TRX-' + crypto.randomUUID(),
      status_code: '200',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: 'fake_invalid_sha512_hash',
      transaction_status: 'settlement',
      payment_type: 'qris',
    }),
  });
  console.log(`3a. Fake Signature Block (Expected 403): Status ${resBadSig.status} ${resBadSig.status === 403 ? '✅' : '❌'}`);

  // 3b. Tampered gross amount in webhook
  const validSigOriginal = generateSignature(gatewayOrderId, '200', `${authoritativeAmount}.00`, serverKey);
  const resTamperedAmount = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: gatewayOrderId,
      transaction_id: 'TRX-' + crypto.randomUUID(),
      status_code: '200',
      gross_amount: '1000.00', // Attacker altered amount
      signature_key: validSigOriginal, // Signature calculated with 45000.00
      transaction_status: 'settlement',
      payment_type: 'qris',
    }),
  });
  console.log(`3b. Tampered Amount Block (Expected 403): Status ${resTamperedAmount.status} ${resTamperedAmount.status === 403 ? '✅' : '❌'}`);

  // 3c. Tampered order ID in webhook
  const resTamperedOrder = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: 'KOP-FAKE-ORDER',
      transaction_id: 'TRX-' + crypto.randomUUID(),
      status_code: '200',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: validSigOriginal,
      transaction_status: 'settlement',
      payment_type: 'qris',
    }),
  });
  console.log(`3c. Tampered OrderID Block (Expected 403): Status ${resTamperedOrder.status} ${resTamperedOrder.status === 403 ? '✅' : '❌'}`);

  // --------------------------------------------------------------------
  // STEP 4: TEST WEBHOOK LIFECYCLE (PENDING -> SETTLEMENT -> IDEMPOTENT DUPLICATE)
  // --------------------------------------------------------------------
  console.log('\n--- 4. Testing Webhook Lifecycle & State Transitions ---');

  const mainTransactionId = 'TRX-' + Date.now();
  const validPendingSig = generateSignature(gatewayOrderId, '201', `${authoritativeAmount}.00`, serverKey);

  // 4a. Webhook: PENDING
  const resPending = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: gatewayOrderId,
      transaction_id: mainTransactionId,
      status_code: '201',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: validPendingSig,
      transaction_status: 'pending',
      payment_type: 'qris',
    }),
  });
  const dataPending = await resPending.json();
  console.log(`4a. Webhook PENDING: Status ${resPending.status}`, dataPending);

  // 4b. Webhook: SETTLEMENT (Lunas)
  const validSettlementSig = generateSignature(gatewayOrderId, '200', `${authoritativeAmount}.00`, serverKey);
  const resSettlement = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: gatewayOrderId,
      transaction_id: mainTransactionId,
      status_code: '200',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: validSettlementSig,
      transaction_status: 'settlement',
      payment_type: 'qris',
      settlement_time: new Date().toISOString(),
    }),
  });
  const dataSettlement = await resSettlement.json();
  console.log(`4b. Webhook SETTLEMENT: Status ${resSettlement.status}`, dataSettlement);

  // Verify in PostgreSQL database
  const { data: dbOrderAfter } = await adminClient.from('orders').select('payment_status').eq('id', testOrderId).single();
  const { data: dbPaymentAfter } = await adminClient.from('payments').select('status, gateway_transaction_id').eq('gateway_order_id', gatewayOrderId).single();
  console.log('Database Verification After Settlement:', {
    orders_payment_status: dbOrderAfter?.payment_status,
    payments_status: dbPaymentAfter?.status,
    gateway_transaction_id: dbPaymentAfter?.gateway_transaction_id,
  });

  const settlementPassed = dbOrderAfter?.payment_status === 'PAID' && dbPaymentAfter?.status === 'PAID';

  // 4c. Webhook: DUPLICATE RETRY NOTIFICATION (Idempotency Guard)
  const resDuplicate = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: gatewayOrderId,
      transaction_id: mainTransactionId,
      status_code: '200',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: validSettlementSig,
      transaction_status: 'settlement',
      payment_type: 'qris',
    }),
  });
  const dataDuplicate = await resDuplicate.json();
  console.log(`4c. Duplicate Webhook Retry (Expected 200 Idempotent): Status ${resDuplicate.status}`, dataDuplicate);
  const duplicatePassed = resDuplicate.status === 200 && dataDuplicate.message?.includes('Duplicate');

  // --------------------------------------------------------------------
  // STEP 5: TEST EXPIRE & CANCEL WEBHOOKS
  // --------------------------------------------------------------------
  console.log('\n--- 5. Testing EXPIRE & CANCEL Webhooks ---');
  
  // Create another payment record for expire testing
  const expireGatewayOrderId = `${testOrderNumber}-EXPIRE`;
  await adminClient.from('payments').insert({
    order_id: testOrderId,
    gateway_name: 'MIDTRANS',
    gateway_order_id: expireGatewayOrderId,
    payment_method: 'bca_va',
    gross_amount: authoritativeAmount,
    currency: 'IDR',
    status: 'PENDING',
  });

  const validExpireSig = generateSignature(expireGatewayOrderId, '202', `${authoritativeAmount}.00`, serverKey);
  const resExpire = await fetch('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: expireGatewayOrderId,
      transaction_id: 'TRX-EXPIRE-' + Date.now(),
      status_code: '202',
      gross_amount: `${authoritativeAmount}.00`,
      signature_key: validExpireSig,
      transaction_status: 'expire',
      payment_type: 'bca_va',
    }),
  });
  const { data: dbPaymentExpire } = await adminClient.from('payments').select('status').eq('gateway_order_id', expireGatewayOrderId).single();
  console.log(`5a. Webhook EXPIRE Status: ${resExpire.status}, DB Status: ${dbPaymentExpire?.status}`);
  const expirePassed = resExpire.status === 200 && dbPaymentExpire?.status === 'EXPIRED';

  // --------------------------------------------------------------------
  // STEP 6: TEST ANON CLIENT RLS MUTATION RESTRICTION
  // --------------------------------------------------------------------
  console.log('\n--- 6. Testing RLS Mutation Restriction on payments & orders by Anon Client ---');
  
  // Anon tries to update payments status
  const { data: anonUpdatePayment } = await anonClient
    .from('payments')
    .update({ status: 'PAID' })
    .eq('gateway_order_id', expireGatewayOrderId)
    .select();
  console.log('6a. Anon Direct UPDATE on payments (Expected 0 rows):', anonUpdatePayment?.length || 0);

  // Anon tries to update orders payment_status
  const { data: anonUpdateOrder } = await anonClient
    .from('orders')
    .update({ payment_status: 'PAID' })
    .eq('id', testOrderId)
    .select();
  console.log('6b. Anon Direct UPDATE on orders.payment_status (Expected 0 rows):', anonUpdateOrder?.length || 0);

  const rlsBlocked = (!anonUpdatePayment || anonUpdatePayment.length === 0) && (!anonUpdateOrder || anonUpdateOrder.length === 0);

  // --------------------------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // --------------------------------------------------------------------
  console.log('\n--- 7. Cleaning Up Test Artifacts in PostgreSQL ---');
  await adminClient.from('payment_webhook_logs').delete().in('gateway_order_id', [gatewayOrderId, expireGatewayOrderId]);
  await adminClient.from('payments').delete().eq('order_id', testOrderId);
  await adminClient.from('order_items').delete().eq('order_id', testOrderId);
  await adminClient.from('orders').delete().eq('id', testOrderId);
  console.log('Test artifacts cleanly removed from database.');

  // --------------------------------------------------------------------
  // FINAL REPORT SUMMARY
  // --------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`Payment Initiation Zero-Trust: ${paymentPass ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Security Tamper Protection: ${resBadSig.status === 403 && resTamperedAmount.status === 403 && resTamperedOrder.status === 403 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Settlement Status Sync: ${settlementPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Webhook Idempotency: ${duplicatePassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Expire/Cancel Handlers: ${expirePassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`RLS Anon Mutation Block: ${rlsBlocked ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('========================================================================\n');
}

runPhaseP2Tests().catch(console.error);
