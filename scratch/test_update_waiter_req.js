const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdateReq() {
  const reqId = crypto.randomUUID();
  const { data: tableData } = await supabaseAdmin.from('tables').select('id').eq('code', '01').single();

  const { data: ins, error: insErr } = await supabaseAdmin.from('waiter_requests').insert({
    id: reqId,
    table_id: tableData.id,
    table_code: '01',
    request_type: 'BANTUAN',
    status: 'OPEN',
    notes: 'Test note'
  }).select().single();

  console.log('Inserted:', ins, insErr);

  // Try update
  const { data: up, error: upErr } = await supabaseAdmin
    .from('waiter_requests')
    .update({
      status: 'HANDLED',
      handled_by: 'Waiter 1',
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reqId)
    .eq('status', 'OPEN')
    .select()
    .maybeSingle();

  console.log('Updated:', up, upErr);

  // Clean up
  await supabaseAdmin.from('waiter_requests').delete().eq('id', reqId);
}

testUpdateReq().catch(console.error);
