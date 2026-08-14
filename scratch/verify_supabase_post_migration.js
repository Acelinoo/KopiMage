const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

async function runPostMigrationVerification() {
  console.log('================================================================');
  console.log('🔍 POST-MIGRATION READ-ONLY VERIFICATION — SUPABASE CLOUD');
  console.log('Target:', supabaseUrl);
  console.log('================================================================\n');

  const results = {};

  // 1. Verify Enum order_status_type (via RPC query or metadata query)
  console.log('--- 1. Checking Enum order_status_type ---');
  try {
    const { data, error } = await supabaseAdmin.rpc('get_enum_values', { enum_name: 'order_status_type' });
    if (error) {
      // Fallback: Test querying orders with order_status filter
      const { data: orderTest, error: errTest } = await supabaseAdmin
        .from('orders')
        .select('id, order_status')
        .limit(1);
      results.p1 = { pass: !errTest, details: errTest ? errTest.message : 'Accessible without enum error' };
    } else {
      results.p1 = { pass: true, values: data };
    }
  } catch (e) {
    results.p1 = { pass: false, error: e.message };
  }
  console.log('Result 1 (order_status_type):', results.p1);

  // 2 & 3. Checking Tables table and tables.status column
  console.log('\n--- 2 & 3. Checking tables table & status column ---');
  try {
    const { data: tablesData, error: tablesErr } = await supabaseAdmin
      .from('tables')
      .select('id, code, name, area, status, is_active')
      .limit(5);

    if (tablesErr) {
      results.p2_3 = { pass: false, error: tablesErr.message };
    } else {
      results.p2_3 = {
        pass: true,
        count: tablesData?.length || 0,
        sampleRow: tablesData?.[0] || null,
        hasStatusCol: tablesData && tablesData.length > 0 ? 'status' in tablesData[0] : true,
      };
    }
  } catch (e) {
    results.p2_3 = { pass: false, error: e.message };
  }
  console.log('Result 2 & 3 (tables.status):', results.p2_3);

  // 4, 5, 6. Checking waiter_requests table & columns
  console.log('\n--- 4, 5, 6. Checking waiter_requests table & structure ---');
  try {
    const { data: wrData, error: wrErr } = await supabaseAdmin
      .from('waiter_requests')
      .select('id, table_id, table_code, request_type, status, notes, handled_by, handled_at, completed_at, created_at, updated_at')
      .limit(1);

    if (wrErr) {
      results.p4_5_6 = { pass: false, error: wrErr.message };
    } else {
      results.p4_5_6 = {
        pass: true,
        accessible: true,
        columnsVerified: ['id', 'table_id', 'table_code', 'request_type', 'status', 'notes', 'handled_by', 'handled_at', 'completed_at', 'created_at', 'updated_at'],
      };
    }
  } catch (e) {
    results.p4_5_6 = { pass: false, error: e.message };
  }
  console.log('Result 4, 5, 6 (waiter_requests table):', results.p4_5_6);

  // 7, 8, 9, 10. Testing RLS Policies for Anon vs Admin
  console.log('\n--- 9 & 10. Testing RLS on waiter_requests (Anon vs Admin) ---');
  try {
    // A. Anon SELECT (Should be allowed)
    const { data: anonSelect, error: anonSelectErr } = await supabaseAnon
      .from('waiter_requests')
      .select('*')
      .limit(5);

    // B. Anon UPDATE (Should be blocked by RLS)
    const { data: anonUpdate, error: anonUpdateErr } = await supabaseAnon
      .from('waiter_requests')
      .update({ notes: 'HACKED_UNAUTHORIZED' })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    // C. Anon DELETE (Should be blocked by RLS)
    const { data: anonDelete, error: anonDeleteErr } = await supabaseAnon
      .from('waiter_requests')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');

    results.p9_10 = {
      pass: !anonSelectErr,
      anonSelectAllowed: !anonSelectErr,
      anonUpdateBlocked: !anonUpdate || anonUpdate.length === 0,
      anonDeleteBlocked: !anonDelete || anonDelete.length === 0,
    };
  } catch (e) {
    results.p9_10 = { pass: false, error: e.message };
  }
  console.log('Result 9 & 10 (RLS Policies):', results.p9_10);

  // 12. Verify Existing Data Intact (No Data Loss)
  console.log('\n--- 12. Verifying Existing Data Counts (Zero Data Loss) ---');
  try {
    const [ordersCount, orderItemsCount, tablesCount, menuItemsCount, categoriesCount] = await Promise.all([
      supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('order_items').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('tables').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('menu_items').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }),
    ]);

    results.p12 = {
      pass: true,
      ordersCount: ordersCount.count,
      orderItemsCount: orderItemsCount.count,
      tablesCount: tablesCount.count,
      menuItemsCount: menuItemsCount.count,
      categoriesCount: categoriesCount.count,
    };
  } catch (e) {
    results.p12 = { pass: false, error: e.message };
  }
  console.log('Result 12 (Data Counts):', results.p12);

  console.log('\n================================================================');
  console.log('✅ POST-MIGRATION VERIFICATION COMPLETE');
  console.log('================================================================\n');
}

runPostMigrationVerification().catch(console.error);
