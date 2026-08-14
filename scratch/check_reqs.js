const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllRequests() {
  const { data: reqs } = await supabaseAdmin.from('waiter_requests').select('*');
  console.log('Current waiter requests in Supabase DB:', reqs);
}

checkAllRequests().catch(console.error);
