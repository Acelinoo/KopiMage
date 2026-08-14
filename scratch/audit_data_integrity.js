const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runDataIntegrityAudit() {
  console.log('=== DATA INTEGRITY & ORPHAN CHECK AUDIT ===\n');

  // 1. Check Orphan order_items (order_items without valid order_id)
  const { data: allOrderItems } = await supabaseAdmin.from('order_items').select('id, order_id');
  const { data: allOrders } = await supabaseAdmin.from('orders').select('id');
  const orderIdSet = new Set((allOrders || []).map(o => o.id));

  const orphanItems = (allOrderItems || []).filter(item => !orderIdSet.has(item.order_id));
  console.log(`Orphan order_items count: ${orphanItems.length}`);

  // 2. Check Orphan waiter_requests (waiter_requests without valid table_id)
  const { data: allRequests } = await supabaseAdmin.from('waiter_requests').select('id, table_id');
  const { data: allTables } = await supabaseAdmin.from('tables').select('id');
  const tableIdSet = new Set((allTables || []).map(t => t.id));

  const orphanRequests = (allRequests || []).filter(req => !tableIdSet.has(req.table_id));
  console.log(`Orphan waiter_requests count: ${orphanRequests.length}`);

  // 3. Check Categories and Menu Items
  const { count: catCount } = await supabaseAdmin.from('categories').select('id', { count: 'exact', head: true });
  const { count: menuCount } = await supabaseAdmin.from('menu_items').select('id', { count: 'exact', head: true });
  console.log(`Master Data: Categories=${catCount}, Menu Items=${menuCount}`);

  // 4. Check Tables count
  console.log(`Master Data: Active Tables=${allTables?.length}`);

  const passed = orphanItems.length === 0 && orphanRequests.length === 0;
  console.log('\nData Integrity Audit Result:', passed ? 'PASSED (0 Orphans) ✅' : 'FAILED (Orphans Detected) ❌');
}

runDataIntegrityAudit().catch(console.error);
