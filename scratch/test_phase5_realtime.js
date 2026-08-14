const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const subscriberClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

async function runPhase5RealtimeTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 5: SUPABASE REALTIME SYNCHRONIZATION TESTS');
  console.log('================================================================\n');

  let waiterRequestEventsReceived = 0;
  let orderEventsReceived = 0;

  // 1. Setup Realtime Subscribers (Simulating Waiter and Customer devices)
  console.log('--- 1. Subscribing to Supabase Realtime Hub ---');
  
  const waiterChannel = subscriberClient
    .channel('test-waiter-realtime-hub-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_requests' }, (payload) => {
      console.log(`[REALTIME PUSH] Received waiter_requests event: ${payload.eventType} (ID: ${payload.new?.id || payload.old?.id})`);
      waiterRequestEventsReceived++;
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      console.log(`[REALTIME PUSH] Received orders event: ${payload.eventType} (ID: ${payload.new?.id || payload.old?.id}, Status: ${payload.new?.order_status})`);
      orderEventsReceived++;
    })
    .subscribe((status) => {
      console.log('Waiter Realtime Channel Status:', status);
    });

  // Wait for subscription to become active
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Trigger Mutasi via Next.js API (Customer Waiter Call)
  console.log('\n--- 2. Triggering API Mutation: Customer Waiter Call (POST /api/waiter/requests) ---');
  const resReq = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_code: '05',
      request_type: 'BANTUAN',
      notes: 'Customer Meja 05 butuh tisu.',
    }),
  });
  const dataReq = await resReq.json();
  const requestId = dataReq.request?.id;
  console.log(`API Created Request ID: ${requestId} (Status ${resReq.status})`);

  // Wait for realtime event propagation
  await new Promise((r) => setTimeout(r, 2000));

  // 3. Trigger Mutasi via Next.js API (Waiter Handles Call)
  console.log('\n--- 3. Triggering API Mutation: Waiter Handles Request (PATCH /api/waiter/requests) ---');
  const resHandle = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: requestId,
      status: 'HANDLED',
      expected_current_status: 'OPEN',
      handled_by: 'Staf Waiter 01',
    }),
  });
  const dataHandle = await resHandle.json();
  console.log(`API Handled Request Status ${resHandle.status}:`, dataHandle.success ? 'SUCCESS' : dataHandle.error);

  // Wait for realtime event propagation
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Trigger Mutasi via Next.js API (Order Lifecycle READY -> DELIVERING -> COMPLETED)
  console.log('\n--- 4. Triggering API Mutation: Order Lifecycle (POST /api/orders & PATCH /api/admin/orders) ---');
  const resOrder = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'dine-in',
      table_id: '05',
      customer_name: 'Budi Test Realtime',
      customer_phone: '08123456789',
      payment_method: 'cashier',
      subtotal: 35000,
      items: [
        {
          cartItemId: 'item-rt-1',
          menu_item_id: 'menu-ayam-katsu',
          name: 'Ayam Katsu',
          basePrice: 35000,
          selectedModifiers: [],
          unitPrice: 35000,
          quantity: 1,
        }
      ],
    }),
  });
  const dataOrder = await resOrder.json();
  const orderId = dataOrder.order?.id;
  console.log(`API Created Order ID: ${orderId} (Status ${resOrder.status})`);

  // Barista sets READY
  await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'READY' }),
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Waiter claims DELIVERING (with atomic concurrency lock)
  const resDelivering = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'DELIVERING', expected_current_status: 'READY' }),
  });
  console.log(`Waiter Claim (DELIVERING): Status ${resDelivering.status}`);
  await new Promise((r) => setTimeout(r, 1500));

  // Waiter completes COMPLETED
  const resCompleted = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'COMPLETED', expected_current_status: 'DELIVERING' }),
  });
  console.log(`Waiter Served (COMPLETED): Status ${resCompleted.status}`);
  await new Promise((r) => setTimeout(r, 2000));

  // 5. Test Multi-Device Concurrency Lock on PostgreSQL Level
  console.log('\n--- 5. Testing Multi-Device Concurrency Lock on Supabase PostgreSQL ---');
  // Create another order for race condition test
  const resOrder2 = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'dine-in',
      table_id: '08',
      customer_name: 'Race Condition Test',
      payment_method: 'cashier',
      subtotal: 35000,
      items: [{ cartItemId: 'it-1', menu_item_id: 'menu-ayam-katsu', name: 'Ayam Katsu', unitPrice: 35000, quantity: 1 }],
    }),
  });
  const dOrder2 = await resOrder2.json();
  const orderId2 = dOrder2.order?.id;
  await fetch('http://localhost:3000/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId2, order_status: 'READY' }) });

  // Fire 2 simultaneous claims
  const [c1, c2] = await Promise.all([
    fetch('http://localhost:3000/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId2, order_status: 'DELIVERING', expected_current_status: 'READY' }) }),
    fetch('http://localhost:3000/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId2, order_status: 'DELIVERING', expected_current_status: 'READY' }) }),
  ]);
  console.log(`Concurrent Claim Response 1: Status ${c1.status}`);
  console.log(`Concurrent Claim Response 2: Status ${c2.status}`);
  const concurrencyLockPassed = (c1.status === 200 && c2.status === 409) || (c1.status === 409 && c2.status === 200);

  // Cleanup subscriber
  await subscriberClient.removeChannel(waiterChannel);

  console.log('\n================================================================');
  console.log(`📊 Total Realtime Events Received: Waiter Requests = ${waiterRequestEventsReceived}, Orders = ${orderEventsReceived}`);
  console.log(`🔒 PostgreSQL Concurrency Lock 200/409: ${concurrencyLockPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  const allPassed = waiterRequestEventsReceived >= 1 && orderEventsReceived >= 1 && concurrencyLockPassed;
  if (allPassed) {
    console.log('✅ ALL PHASE 5 REALTIME SYNCHRONIZATION & CONCURRENCY TESTS PASSED 100%!');
  } else {
    console.error('❌ SOME TESTS FAILED');
  }
  console.log('================================================================\n');
}

runPhase5RealtimeTests().catch(console.error);
