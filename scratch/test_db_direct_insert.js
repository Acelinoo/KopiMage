const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testDirectInsert() {
  const testOrderId = crypto.randomUUID();
  const insertPayload = {
    id: testOrderId,
    order_number: 'KOP-DIRECT-' + Date.now().toString().slice(-4),
    order_display_number: '#A999',
    mode: 'dine-in',
    customer_name: 'Test Direct DB',
    payment_method: 'cashier',
    subtotal: 35000,
    order_status: 'NEW_ORDER',
    payment_status: 'UNPAID',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert(insertPayload)
    .select()
    .single();

  console.log('Direct Insert orders result:', data, error);

  // Test insert to order_items
  const { data: itemData, error: itemError } = await supabaseAdmin
    .from('order_items')
    .insert({
      id: crypto.randomUUID(),
      order_id: testOrderId,
      item_name: 'Ayam Katsu Test',
      unit_price: 35000,
      quantity: 1,
      subtotal: 35000,
      notes: 'Test note'
    })
    .select()
    .single();

  console.log('Direct Insert order_items result:', itemData, itemError);

  // Clean up
  await supabaseAdmin.from('orders').delete().eq('id', testOrderId);
  console.log('Cleaned up test record.');
}

testDirectInsert().catch(console.error);
