import crypto from 'crypto';

/**
 * Midtrans Configuration Helper (Server-Only)
 * Strictly isolates Server Key to server-side execution context.
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
 * Constant-Time String Comparison to prevent timing attacks
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a.toLowerCase());
    const bufB = Buffer.from(b.toLowerCase());
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

/**
 * Verifies Midtrans Webhook Notification Cryptographic Signature
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 * Uses constant-time string comparison.
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

  // Normalize grossAmount representation
  const amountStr = typeof grossAmount === 'number' ? grossAmount.toFixed(2) : grossAmount;

  // Calculate expected SHA512 hash
  const rawString = `${orderId}${statusCode}${amountStr}${secretKey}`;
  const calculatedHash = crypto.createHash('sha512').update(rawString).digest('hex');

  // Also calculate integer-formatted amount (e.g., without .00)
  const rawStringInt = `${orderId}${statusCode}${String(grossAmount).replace(/\.00$/, '')}${secretKey}`;
  const calculatedHashInt = crypto.createHash('sha512').update(rawStringInt).digest('hex');

  return (
    timingSafeEqualStr(calculatedHash, receivedSignature) ||
    timingSafeEqualStr(calculatedHashInt, receivedSignature)
  );
}

export interface SnapTransactionParams {
  gatewayOrderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

/**
 * Calls Midtrans Snap API to create an authoritative payment transaction token & redirect URL
 */
export async function createMidtransSnapTransaction(params: SnapTransactionParams) {
  const { snapApiUrl, serverKey } = getMidtransConfig();

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured in server environment.');
  }

  const basicAuthHeader = Buffer.from(`${serverKey}:`).toString('base64');

  const payload = {
    transaction_details: {
      order_id: params.gatewayOrderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerName || 'Pelanggan KopiMage',
      phone: params.customerPhone || '',
    },
    item_details: (params.items && params.items.length > 0)
      ? params.items.map((i) => ({
          id: i.id.slice(0, 50),
          name: i.name.slice(0, 50),
          price: Math.round(i.price),
          quantity: Math.max(1, i.quantity),
        }))
      : undefined,
    expiry: {
      unit: 'minute',
      duration: 15, // 15-minute countdown expiry
    },
  };

  const response = await fetch(snapApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${basicAuthHeader}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    const errorMsg = data.error_messages ? data.error_messages.join(', ') : (data.message || 'Failed to create Snap transaction');
    throw new Error(`Midtrans Snap Error: ${errorMsg}`);
  }

  return {
    snapToken: data.token as string,
    redirectUrl: data.redirect_url as string,
  };
}
