const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testHardeningStateMachine() {
  console.log('========================================================================');
  console.log('🚀 TESTING HARDENING: ORDER STATE MACHINE & STRICT DB ERROR PROPAGATION');
  console.log('========================================================================\n');

  // 1. Create a test order
  const orderId = crypto.randomUUID();
  const { data: tableData } = await supabaseAdmin.from('tables').select('id').eq('code', '01').single();
  
  await supabaseAdmin.from('orders').insert({
    id: orderId,
    order_number: 'KOP-HARDEN-' + Date.now().toString().slice(-4),
    mode: 'dine-in',
    table_id: tableData.id,
    customer_name: 'Hardening Tester',
    payment_method: 'cashier',
    subtotal: 25000,
    order_status: 'NEW_ORDER',
    payment_status: 'UNPAID',
  });

  console.log('1. Created test order in NEW_ORDER state:', orderId);

  // 2. Test ILLEGAL TRANSITIONS (All should return 400)
  console.log('\n--- 2. Testing Illegal State Transitions (Expected: 400 Bad Request) ---');
  
  // Illegal 1: NEW_ORDER -> COMPLETED
  const resIll1 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'COMPLETED' }),
  });
  const dataIll1 = await resIll1.json();
  console.log(`Illegal NEW_ORDER -> COMPLETED: Status ${resIll1.status} (Expected 400):`, dataIll1.error);

  // Illegal 2: NEW_ORDER -> READY
  const resIll2 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'READY' }),
  });
  const dataIll2 = await resIll2.json();
  console.log(`Illegal NEW_ORDER -> READY: Status ${resIll2.status} (Expected 400):`, dataIll2.error);

  // 3. Test LEGAL PROGRESSION
  console.log('\n--- 3. Testing Legal Progression (Expected: 200 OK for each step) ---');
  
  // Step 1: NEW_ORDER -> PREPARING
  const resLeg1 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'PREPARING', expected_current_status: 'NEW_ORDER' }),
  });
  console.log(`Legal NEW_ORDER -> PREPARING: Status ${resLeg1.status}`);

  // Step 2: PREPARING -> READY
  const resLeg2 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'READY', expected_current_status: 'PREPARING' }),
  });
  console.log(`Legal PREPARING -> READY: Status ${resLeg2.status}`);

  // Illegal 3: READY -> PREPARING (Backwards transition)
  const resIll3 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'PREPARING' }),
  });
  const dataIll3 = await resIll3.json();
  console.log(`Illegal READY -> PREPARING (Backward): Status ${resIll3.status} (Expected 400):`, dataIll3.error);

  // Step 3: READY -> DELIVERING
  const resLeg3 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'DELIVERING', expected_current_status: 'READY' }),
  });
  console.log(`Legal READY -> DELIVERING: Status ${resLeg3.status}`);

  // Step 4: DELIVERING -> COMPLETED
  const resLeg4 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'COMPLETED', expected_current_status: 'DELIVERING' }),
  });
  console.log(`Legal DELIVERING -> COMPLETED: Status ${resLeg4.status}`);

  // Illegal 4: COMPLETED -> READY
  const resIll4 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'READY' }),
  });
  const dataIll4 = await resIll4.json();
  console.log(`Illegal COMPLETED -> READY: Status ${resIll4.status} (Expected 400):`, dataIll4.error);

  // Illegal 5: COMPLETED -> CANCELLED
  const resIll5 = await fetch('http://localhost:3000/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, order_status: 'CANCELLED' }),
  });
  const dataIll5 = await resIll5.json();
  console.log(`Illegal COMPLETED -> CANCELLED: Status ${resIll5.status} (Expected 400):`, dataIll5.error);

  // 4. Assert all test results
  const allLegalPass = resLeg1.status === 200 && resLeg2.status === 200 && resLeg3.status === 200 && resLeg4.status === 200;
  const allIllegalBlocked = resIll1.status === 400 && resIll2.status === 400 && resIll3.status === 400 && resIll4.status === 400 && resIll5.status === 400;

  // Cleanup
  await supabaseAdmin.from('orders').delete().eq('id', orderId);

  console.log('\n========================================================================');
  console.log(`Legal State Transitions: ${allLegalPass ? 'ALL PASSED (200 OK) ✅' : 'FAILED ❌'}`);
  console.log(`Illegal State Transitions: ${allIllegalBlocked ? 'ALL BLOCKED (400 Bad Request) ✅' : 'FAILED ❌'}`);
  console.log('========================================================================\n');
}

testHardeningStateMachine().catch(console.error);
