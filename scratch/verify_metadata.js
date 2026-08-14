const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyDetailedMetadata() {
  console.log('--- DETAILED METADATA & SCHEMA AUDIT ---');

  // Test Realtime listener subscription to orders and waiter_requests
  console.log('\nTesting Realtime Channel Connection on tables...');
  const channel = supabaseAdmin
    .channel('test-post-migration-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {})
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {})
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_requests' }, () => {})
    .subscribe((status) => {
      console.log('Realtime Subscription Status:', status);
    });

  // Wait for subscription check
  await new Promise(r => setTimeout(r, 2500));
  await supabaseAdmin.removeChannel(channel);

  console.log('\n--- VERIFICATION FINISHED ---');
}

verifyDetailedMetadata().catch(console.error);
