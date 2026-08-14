const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testWaiterReqConcurrency() {
  // 1. Create a request directly in Supabase DB with valid table
  const reqId = crypto.randomUUID();
  const { data: tableData } = await supabaseAdmin.from('tables').select('id').eq('code', '01').single();

  await supabaseAdmin.from('waiter_requests').insert({
    id: reqId,
    table_id: tableData?.id,
    table_code: '01',
    request_type: 'BILL',
    status: 'OPEN',
    notes: 'Concurrency Test'
  });

  console.log('Created waiter request in DB:', reqId);

  // 2. Fire two simultaneous claims
  const [c1, c2] = await Promise.all([
    fetch('http://localhost:3000/api/waiter/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: reqId, status: 'HANDLED', expected_current_status: 'OPEN', handled_by: 'Waiter 1' }),
    }),
    fetch('http://localhost:3000/api/waiter/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: reqId, status: 'HANDLED', expected_current_status: 'OPEN', handled_by: 'Waiter 2' }),
    }),
  ]);

  const d1 = await c1.json();
  const d2 = await c2.json();

  console.log('Claim 1 Status:', c1.status, d1.success ? 'SUCCESS' : d1.error);
  console.log('Claim 2 Status:', c2.status, d2.success ? 'SUCCESS' : d2.error);

  const pass = (c1.status === 200 && c2.status === 409) || (c1.status === 409 && c2.status === 200);
  console.log('Concurrency Protection Result:', pass ? 'PASSED (200 & 409) ✅' : 'FAILED ❌');

  // Clean up
  await supabaseAdmin.from('waiter_requests').delete().eq('id', reqId);
}

testWaiterReqConcurrency().catch(console.error);
