const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function testRealtimeBroadcast() {
  console.log('Testing Realtime Event receiving with service role client...');

  let events = [];

  const channel = supabase
    .channel('room-1', { config: { broadcast: { self: true } } })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      console.log('RECEIVED REALTIME POSTGRES CHANGE ON ORDERS:', payload.eventType, payload.new?.id || payload.old?.id);
      events.push(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_requests' }, (payload) => {
      console.log('RECEIVED REALTIME POSTGRES CHANGE ON WAITER_REQUESTS:', payload.eventType, payload.new?.id || payload.old?.id);
      events.push(payload);
    })
    .subscribe((status, err) => {
      console.log('Channel Subscription Status:', status, err || '');
    });

  // Wait for subscription
  await new Promise(r => setTimeout(r, 2000));

  // Trigger insert on waiter_requests directly via admin client
  console.log('Triggering insert to waiter_requests...');
  const { data: inserted, error: insErr } = await supabase
    .from('waiter_requests')
    .insert({
      table_id: '8c4c7bf3-483b-41b4-bbe7-dd6fe9220538',
      table_code: '01',
      request_type: 'BANTUAN',
      status: 'OPEN',
      notes: 'Realtime Listener Test'
    })
    .select()
    .single();

  console.log('Inserted row ID:', inserted?.id, insErr ? insErr.message : '');

  // Wait 3 seconds for event to arrive
  await new Promise(r => setTimeout(r, 3000));

  // Clean up
  if (inserted?.id) {
    await supabase.from('waiter_requests').delete().eq('id', inserted.id);
  }

  await supabase.removeChannel(channel);

  console.log('Total events captured:', events.length);
}

testRealtimeBroadcast().catch(console.error);
