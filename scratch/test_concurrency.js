const http = require('http');

async function createTestOrder() {
  const payload = JSON.stringify({
    mode: 'dine-in',
    table_id: '04',
    customer_name: 'Test Concurrency Waiter',
    customer_phone: '081234567890',
    items: [
      {
        cartItemId: 'item-1',
        menu_item_id: 'menu-ayam-katsu',
        name: 'Ayam Katsu',
        basePrice: 35000,
        selectedModifiers: [],
        unitPrice: 35000,
        quantity: 1,
      }
    ],
    subtotal: 35000,
    payment_method: 'cashier',
  });

  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Order creation error:', data);
  }
  return data.order?.id;
}

async function setOrderReady(orderId) {
  const res = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      order_status: 'READY',
    }),
  });
  return res.ok;
}

async function simulateRaceCondition() {
  console.log('--- STARTING CONCURRENCY RACE CONDITION TEST ---');
  const orderId = await createTestOrder();
  console.log('1. Created Test Order ID:', orderId);

  await setOrderReady(orderId);
  console.log('2. Set Order Status to READY');

  console.log('3. Firing 2 simultaneous claims (Waiter A & Waiter B)...');
  const claimPayload = (waiterName) => JSON.stringify({
    order_id: orderId,
    order_status: 'DELIVERING',
    expected_current_status: 'READY',
  });

  const [resA, resB] = await Promise.all([
    fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: claimPayload('Waiter A'),
    }),
    fetch('http://localhost:3000/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: claimPayload('Waiter B'),
    }),
  ]);

  const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

  console.log(`Response A Status: ${resA.status}`, dataA.success ? 'SUCCESS (Claimed)' : dataA.error);
  console.log(`Response B Status: ${resB.status}`, dataB.success ? 'SUCCESS (Claimed)' : dataB.error);

  // 4. Test Transition DELIVERING -> COMPLETED
  console.log('\n4. Testing DELIVERING -> COMPLETED transition...');
  const resComplete = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      order_status: 'COMPLETED',
      expected_current_status: 'DELIVERING',
    }),
  });
  const dataComplete = await resComplete.json();
  console.log(`Complete Status Code: ${resComplete.status}`, dataComplete.success ? 'SUCCESS (Served)' : dataComplete.error);

  // 5. Test Invalid Transition COMPLETED -> DELIVERING (Should be rejected)
  console.log('\n5. Testing Invalid Backward Transition COMPLETED -> DELIVERING...');
  const resInvalid = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      order_status: 'DELIVERING',
      expected_current_status: 'READY',
    }),
  });
  const dataInvalid = await resInvalid.json();
  console.log(`Invalid Transition Status Code: ${resInvalid.status}`, dataInvalid.success ? 'UNEXPECTED SUCCESS' : dataInvalid.error);

  const oneSuccess = (resA.status === 200 && resB.status === 409) || (resA.status === 409 && resB.status === 200);
  const allPassed = oneSuccess && resComplete.status === 200 && resInvalid.status === 409;
  console.log('\n=============================================');
  if (allPassed) {
    console.log('✅ ALL PHASE 3 STATE MACHINE & CONCURRENCY TESTS PASSED 100%!');
  } else {
    console.error('❌ SOME TESTS FAILED');
  }
  console.log('=============================================\n');
}

simulateRaceCondition().catch(console.error);
