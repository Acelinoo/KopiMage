const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testSingleReqClaim() {
  const reqId = crypto.randomUUID();
  const { data: tableData } = await supabaseAdmin.from('tables').select('id').eq('code', '01').single();

  await supabaseAdmin.from('waiter_requests').insert({
    id: reqId,
    table_id: tableData.id,
    table_code: '01',
    request_type: 'BANTUAN',
    status: 'OPEN',
    notes: 'Single Claim Test'
  });

  console.log('Created request in DB:', reqId);

  const res = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      status: 'HANDLED',
      expected_current_status: 'OPEN',
      handled_by: 'Waiter Andi',
    }),
  });

  const data = await res.json();
  console.log('PATCH Status:', res.status, data);

  await supabaseAdmin.from('waiter_requests').delete().eq('id', reqId);
}

testSingleReqClaim().catch(console.error);
