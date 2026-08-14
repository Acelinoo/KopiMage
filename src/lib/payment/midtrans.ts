import crypto from 'crypto';

/**
 * Midtrans Configuration Helper (Server-Only)
 * Strictly isolates Server Key to server-side context.
 */
export function getMidtransConfig() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const merchantId = process.env.MIDTRANS_MERCHANT_ID || '';

  const snapApiUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const coreApiUrl = isProduction
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  return {
    isProduction,
    serverKey,
    clientKey,
    merchantId,
    snapApiUrl,
    coreApiUrl,
  };
}

/**
 * Verifies Midtrans Webhook Notification Cryptographic Signature
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string | number,
  receivedSignature: string,
  serverKey?: string
): boolean {
  const secretKey = serverKey || process.env.MIDTRANS_SERVER_KEY || '';
  if (!secretKey || !receivedSignature) {
    return false;
  }

  // Normalize grossAmount to string representation (e.g. "47000.00" or "47000")
  const amountStr = typeof grossAmount === 'number' ? grossAmount.toFixed(2) : grossAmount;

  // Calculate expected SHA512 hash
  const rawString = `${orderId}${statusCode}${amountStr}${secretKey}`;
  const calculatedHash = crypto.createHash('sha512').update(rawString).digest('hex');

  // Also test integer-format amount if gateway formatted without decimals
  const rawStringInt = `${orderId}${statusCode}${String(grossAmount).replace(/\.00$/, '')}${secretKey}`;
  const calculatedHashInt = crypto.createHash('sha512').update(rawStringInt).digest('hex');

  return (
    calculatedHash.toLowerCase() === receivedSignature.toLowerCase() ||
    calculatedHashInt.toLowerCase() === receivedSignature.toLowerCase()
  );
}
