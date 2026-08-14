const crypto = require('crypto');

function verifyMidtransSignature(orderId, statusCode, grossAmount, receivedSignature, serverKey) {
  const secretKey = serverKey || '';
  if (!secretKey || !receivedSignature) return false;

  const amountStr = typeof grossAmount === 'number' ? grossAmount.toFixed(2) : grossAmount;
  const rawString = `${orderId}${statusCode}${amountStr}${secretKey}`;
  const calculatedHash = crypto.createHash('sha512').update(rawString).digest('hex');

  const rawStringInt = `${orderId}${statusCode}${String(grossAmount).replace(/\.00$/, '')}${secretKey}`;
  const calculatedHashInt = crypto.createHash('sha512').update(rawStringInt).digest('hex');

  return (
    calculatedHash.toLowerCase() === receivedSignature.toLowerCase() ||
    calculatedHashInt.toLowerCase() === receivedSignature.toLowerCase()
  );
}

function runSignatureTest() {
  console.log('=== TESTING MIDTRANS SHA-512 SIGNATURE VERIFICATION ===\n');

  const testServerKey = 'SB-Mid-server-test-secret-key-12345';
  const testOrderId = 'KOP-20260814-168-PAY1';
  const testStatusCode = '200';
  const testGrossAmount = '47000.00';

  // 1. Generate legitimate signature
  const raw = `${testOrderId}${testStatusCode}${testGrossAmount}${testServerKey}`;
  const validSignature = crypto.createHash('sha512').update(raw).digest('hex');

  // Test 1: Valid signature verification
  const isMatchValid = verifyMidtransSignature(testOrderId, testStatusCode, testGrossAmount, validSignature, testServerKey);
  console.log('1. Valid Signature Test:', isMatchValid ? 'PASSED ✅' : 'FAILED ❌');

  // Test 2: Tampered gross amount (Attacker tries to alter amount from 47000 to 1000)
  const isMatchTamperedAmount = verifyMidtransSignature(testOrderId, testStatusCode, '1000.00', validSignature, testServerKey);
  console.log('2. Tampered Amount Block Test:', !isMatchTamperedAmount ? 'PASSED (Blocked) ✅' : 'FAILED (Accepted) ❌');

  // Test 3: Tampered order id
  const isMatchTamperedOrderId = verifyMidtransSignature('KOP-FAKE-ORDER', testStatusCode, testGrossAmount, validSignature, testServerKey);
  console.log('3. Tampered OrderId Block Test:', !isMatchTamperedOrderId ? 'PASSED (Blocked) ✅' : 'FAILED (Accepted) ❌');

  // Test 4: Fake signature
  const isMatchFakeSig = verifyMidtransSignature(testOrderId, testStatusCode, testGrossAmount, 'invalid_signature_hash', testServerKey);
  console.log('4. Fake Signature Block Test:', !isMatchFakeSig ? 'PASSED (Blocked) ✅' : 'FAILED (Accepted) ❌');

  const allPassed = isMatchValid && !isMatchTamperedAmount && !isMatchTamperedOrderId && !isMatchFakeSig;
  console.log('\nOverall Signature Verification Test:', allPassed ? 'ALL PASSED 100% ✅' : 'FAILED ❌');
}

runSignatureTest();
