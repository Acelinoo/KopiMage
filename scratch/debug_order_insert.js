const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

async function debugOrder() {
  console.log('Sending order request to local API...');
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'dine-in',
      table_id: '03',
      customer_name: 'Debug Customer',
      payment_method: 'cashier',
      subtotal: 35000,
      items: [
        {
          cartItemId: 'item-1',
          menu_item_id: 'menu-ayam-katsu',
          name: 'Ayam Katsu',
          basePrice: 35000,
          unitPrice: 35000,
          quantity: 1
        }
      ]
    })
  });

  const data = await res.json();
  console.log('API Response Status:', res.status, data);

  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: dbData, error } = await supabaseAdmin
    .from('orders')
    .select('*, tables(*), order_items(*)')
    .eq('id', data.order?.id);

  console.log('Direct Supabase DB Query result:', dbData, error);
}

debugOrder().catch(console.error);
