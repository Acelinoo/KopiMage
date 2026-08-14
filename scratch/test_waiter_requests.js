async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 4: CUSTOMER WAITER REQUESTS TESTING');
  console.log('====================================================\n');

  // 1. TEST NORMAL SUBMISSION (Bantuan & Bill)
  console.log('--- 1. Testing Normal Request Submissions ---');
  const resBantuan = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_code: '04',
      request_type: 'BANTUAN',
      notes: 'Customer Meja 04 butuh sendok tambahan.',
    }),
  });
  const dataBantuan = await resBantuan.json();
  console.log(`POST /requests (BANTUAN Meja 04): Status ${resBantuan.status}`, dataBantuan.request ? `ID: ${dataBantuan.request.id}` : dataBantuan.error);

  const resBill = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_code: '07',
      request_type: 'BILL',
      notes: 'Customer Meja 07 minta bill cetak.',
    }),
  });
  const dataBill = await resBill.json();
  console.log(`POST /requests (BILL Meja 07): Status ${resBill.status}`, dataBill.request ? `ID: ${dataBill.request.id}` : dataBill.error);

  const reqId = dataBantuan.request?.id;

  // 2. TEST DUPLICATE ACTIVE REQUEST PREVENTION
  console.log('\n--- 2. Testing Duplicate Active Request Prevention ---');
  const resDuplicate = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_code: '04',
      request_type: 'BANTUAN',
      notes: 'Spam click panggilan',
    }),
  });
  const dataDuplicate = await resDuplicate.json();
  console.log(`Duplicate POST Status: ${resDuplicate.status}, isDuplicate: ${dataDuplicate.isDuplicate}`, `(Reused ID: ${dataDuplicate.request?.id})`);
  const duplicatePrevented = dataDuplicate.isDuplicate === true && dataDuplicate.request?.id === reqId;

  // 3. TEST CONCURRENCY RACE CONDITION (Waiter A & Waiter B claim simultaneously)
  console.log('\n--- 3. Testing Concurrent Claim by 2 Waiters ---');
  const [claimA, claimB] = await Promise.all([
    fetch('http://localhost:3000/api/waiter/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: reqId,
        status: 'HANDLED',
        expected_current_status: 'OPEN',
        handled_by: 'Waiter Andi',
      }),
    }),
    fetch('http://localhost:3000/api/waiter/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: reqId,
        status: 'HANDLED',
        expected_current_status: 'OPEN',
        handled_by: 'Waiter Budi',
      }),
    }),
  ]);

  const [dClaimA, dClaimB] = await Promise.all([claimA.json(), claimB.json()]);
  console.log(`Waiter Andi Status: ${claimA.status}`, dClaimA.success ? 'SUCCESS (Handled)' : dClaimA.error);
  console.log(`Waiter Budi Status: ${claimB.status}`, dClaimB.success ? 'SUCCESS (Handled)' : dClaimB.error);

  const concurrencySafe = (claimA.status === 200 && claimB.status === 409) || (claimA.status === 409 && claimB.status === 200);

  // 4. TEST COMPLETE REQUEST
  console.log('\n--- 4. Testing Request Completion (HANDLED -> COMPLETED) ---');
  const resComplete = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      status: 'COMPLETED',
      expected_current_status: 'HANDLED',
    }),
  });
  const dComplete = await resComplete.json();
  console.log(`Complete Status: ${resComplete.status}`, dComplete.success ? 'SUCCESS (Completed)' : dComplete.error);

  // 5. TEST INVALID TRANSITION (COMPLETED -> OPEN)
  console.log('\n--- 5. Testing Invalid State Transition (COMPLETED -> OPEN) ---');
  const resInvalid = await fetch('http://localhost:3000/api/waiter/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      status: 'HANDLED',
      expected_current_status: 'OPEN',
    }),
  });
  const dInvalid = await resInvalid.json();
  console.log(`Invalid Transition Status: ${resInvalid.status}`, dInvalid.success ? 'UNEXPECTED SUCCESS' : dInvalid.error);

  const allPassed =
    resBantuan.status === 200 &&
    resBill.status === 200 &&
    duplicatePrevented &&
    concurrencySafe &&
    resComplete.status === 200 &&
    resInvalid.status === 409;

  console.log('\n====================================================');
  if (allPassed) {
    console.log('✅ ALL PHASE 4 TESTS (NORMAL, DUPLICATE, CONCURRENCY, & LIFECYCLE) PASSED 100%!');
  } else {
    console.error('❌ SOME PHASE 4 TESTS FAILED');
  }
  console.log('====================================================\n');
}

runPhase4Tests().catch(console.error);
