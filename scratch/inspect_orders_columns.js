const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectColumns() {
  // Test insert with minimal columns to find exact valid schema
  const testId = crypto.randomUUID();
  const minimal = {
    id: testId,
    order_number: 'KOP-TEST-' + Date.now().toString().slice(-4),
    mode: 'dine-in',
    customer_name: 'Column Inspector',
    payment_method: 'cashier',
    subtotal: 35000,
    order_status: 'NEW_ORDER',
    payment_status: 'UNPAID',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('orders').insert(minimal).select().single();
  console.log('Minimal Insert result:', data ? Object.keys(data) : 'ERROR', error);

  if (data?.id) {
    await supabaseAdmin.from('orders').delete().eq('id', data.id);
  }
}

inspectColumns().catch(console.error);
