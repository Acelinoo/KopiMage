const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client for backend operations
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// Waiter client simulating browser /waiter page
const waiterClient = createClient(supabaseUrl, anonKey);

async function testPhase5RealtimeE2E() {
  console.log('================================================================');
  console.log('🚀 TESTING PHASE 5 SUPABASE REALTIME MULTI-DEVICE SUBSCRIBER');
  console.log('================================================================\n');

  let capturedEvents = [];

  console.log('1. Connecting Realtime Channel for /waiter floor hub...');
  const waiterChannel = waiterClient
    .channel('waiter-floor-live-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_requests' }, (payload) => {
      console.log(`[REALTIME BROADCAST RECEIVED] waiter_requests: ${payload.eventType} (ID: ${payload.new?.id || payload.old?.id})`);
      capturedEvents.push({ table: 'waiter_requests', event: payload.eventType, data: payload.new });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      console.log(`[REALTIME BROADCAST RECEIVED] orders: ${payload.eventType} (ID: ${payload.new?.id || payload.old?.id}, Status: ${payload.new?.order_status})`);
      capturedEvents.push({ table: 'orders', event: payload.eventType, data: payload.new });
    })
    .subscribe((status, err) => {
      console.log('Realtime Hub Status:', status, err || '');
    });

  // Wait 2.5s for subscription handshake
  await new Promise(r => setTimeout(r, 2500));

  // 2. Trigger Customer Waiter Request
  console.log('\n2. Triggering Customer Waiter Request via API...');
  const newReqId = crypto.randomUUID();
  const { data: insertedReq, error: reqErr } = await supabaseAdmin
    .from('waiter_requests')
    .insert({
      id: newReqId,
      table_id: '8c4c7bf3-483b-41b4-bbe7-dd6fe9220538',
      table_code: '01',
      request_type: 'BANTUAN',
      status: 'OPEN',
      notes: 'Customer Meja 01 butuh bantuan'
    })
    .select()
    .single();

  console.log('Created waiter request:', insertedReq?.id, reqErr ? reqErr.message : 'OK');

  // Wait 2.5s for Realtime event
  await new Promise(r => setTimeout(r, 2500));

  // 3. Trigger Order State Transitions via API
  console.log('\n3. Triggering Order Lifecycle via API...');
  const newOrderId = crypto.randomUUID();
  const { data: insertedOrder } = await supabaseAdmin
    .from('orders')
    .insert({
      id: newOrderId,
      order_number: 'KOP-' + Date.now().toString().slice(-6),
      mode: 'dine-in',
      customer_name: 'Realtime Tester',
      payment_method: 'cashier',
      subtotal: 35000,
      order_status: 'NEW_ORDER',
      payment_status: 'UNPAID',
    })
    .select()
    .single();

  console.log('Created order:', insertedOrder?.id);
  await new Promise(r => setTimeout(r, 1500));

  // Update order to READY
  await supabaseAdmin.from('orders').update({ order_status: 'READY' }).eq('id', newOrderId);
  console.log('Updated order to READY');
  await new Promise(r => setTimeout(r, 1500));

  // Update order to DELIVERING
  await supabaseAdmin.from('orders').update({ order_status: 'DELIVERING' }).eq('id', newOrderId);
  console.log('Updated order to DELIVERING');
  await new Promise(r => setTimeout(r, 1500));

  // Update order to COMPLETED
  await supabaseAdmin.from('orders').update({ order_status: 'COMPLETED' }).eq('id', newOrderId);
  console.log('Updated order to COMPLETED');
  await new Promise(r => setTimeout(r, 2000));

  // 4. Test Concurrency Protection 200 vs 409 via Next.js API
  console.log('\n4. Testing PostgreSQL Atomic Concurrency Lock (200 vs 409)...');
  const testOrderSeq = crypto.randomUUID();
  await supabaseAdmin.from('orders').insert({
    id: testOrderSeq,
    order_number: 'KOP-LOCK-' + Date.now().toString().slice(-4),
    mode: 'dine-in',
    customer_name: 'Concurrency Tester',
    payment_method: 'cashier',
    subtotal: 25000,
    order_status: 'READY',
    payment_status: 'UNPAID',
  });

  const [resA, resB] = await Promise.all([
    fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: testOrderSeq, order_status: 'DELIVERING', expected_current_status: 'READY' }),
    }),
    fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: testOrderSeq, order_status: 'DELIVERING', expected_current_status: 'READY' }),
    }),
  ]);

  console.log(`Waiter Claim A: ${resA.status}`);
  console.log(`Waiter Claim B: ${resB.status}`);
  const concurrencyPassed = (resA.status === 200 && resB.status === 409) || (resA.status === 409 && resB.status === 200);

  // Clean up
  await supabaseAdmin.from('waiter_requests').delete().eq('id', newReqId);
  await supabaseAdmin.from('orders').delete().in('id', [newOrderId, testOrderSeq]);
  await waiterClient.removeChannel(waiterChannel);

  console.log('\n================================================================');
  console.log(`Captured Realtime Events: ${capturedEvents.length}`);
  console.log(`PostgreSQL Atomic Concurrency Lock: ${concurrencyPassed ? 'PASSED (200 & 409) ✅' : 'FAILED ❌'}`);
  console.log('================================================================\n');
}

testPhase5RealtimeE2E().catch(console.error);
