const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function auditSecurityRLS() {
  console.log('=== SECURITY AUDIT: RLS MUTATION RESTRICTION ON ANON CLIENT ===\n');

  // 1. Create a dummy order via Admin Client
  const testOrderId = crypto.randomUUID();
  await adminClient.from('orders').insert({
    id: testOrderId,
    order_number: 'SEC-AUDIT-' + Date.now().toString().slice(-4),
    mode: 'dine-in',
    customer_name: 'Security Test',
    payment_method: 'cashier',
    subtotal: 20000,
    order_status: 'NEW_ORDER',
    payment_status: 'UNPAID',
  });

  // 2. Try to perform direct UPDATE via ANON client (Should be BLOCKED / 0 rows affected by RLS)
  console.log('1. Attempting unauthorized direct UPDATE on orders table via ANON client...');
  const { data: anonUpdateData, error: anonUpdateError } = await anonClient
    .from('orders')
    .update({ order_status: 'COMPLETED' })
    .eq('id', testOrderId)
    .select();

  console.log('ANON Direct Update Result (Expect 0 rows / error):', anonUpdateData, anonUpdateError);

  // 3. Try to perform direct DELETE via ANON client (Should be BLOCKED)
  console.log('2. Attempting unauthorized direct DELETE on orders table via ANON client...');
  const { data: anonDeleteData, error: anonDeleteError } = await anonClient
    .from('orders')
    .delete()
    .eq('id', testOrderId)
    .select();

  console.log('ANON Direct Delete Result (Expect 0 rows / error):', anonDeleteData, anonDeleteError);

  // 4. Verify that data in PostgreSQL remains pristine (status still NEW_ORDER)
  const { data: checkDb } = await adminClient.from('orders').select('order_status').eq('id', testOrderId).single();
  console.log('Database verification: order_status is still:', checkDb?.order_status);

  const securityPassed = (!anonUpdateData || anonUpdateData.length === 0) && (!anonDeleteData || anonDeleteData.length === 0) && checkDb?.order_status === 'NEW_ORDER';
  console.log('\nSecurity RLS Mutation Block Result:', securityPassed ? 'PASSED ✅' : 'FAILED ❌');

  // Cleanup
  await adminClient.from('orders').delete().eq('id', testOrderId);
}

auditSecurityRLS().catch(console.error);
