// Server-side shared order store for real-time sync across /api/orders, /api/admin/orders, and KDS

export interface OrderItemPayload {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  modifiers?: any[];
}

export interface OrderRecord {
  id: string;
  client_order_id?: string | null;
  order_number: string;
  order_display_number?: string | null;
  tracking_secret: string;
  mode: 'dine-in' | 'takeaway';
  table_id: string | null;
  customer_name: string;
  customer_phone: string;
  payment_method: 'cashier' | 'qris_static' | 'bank_transfer';
  payment_proof_url?: string | null;
  subtotal: number;
  total_amount: number;
  order_status: 'NEW_ORDER' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' | 'CANCELLATION_REQUESTED';
  payment_status: 'UNPAID' | 'VERIFYING' | 'PAID' | 'REJECTED' | 'REFUND_REQUIRED' | 'REFUNDED';
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItemPayload[];
  order_items?: OrderItemPayload[];
}

// Global in-memory array across HMR invocations in Node server environment
const globalForOrders = globalThis as unknown as {
  sharedOrdersStore: OrderRecord[];
};

export const sharedOrdersStore: OrderRecord[] =
  globalForOrders.sharedOrdersStore || [];

if (process.env.NODE_ENV !== 'production') {
  globalForOrders.sharedOrdersStore = sharedOrdersStore;
}

/**
 * Add a newly created order to memory store
 */
export function addOrderToStore(order: OrderRecord) {
  const normalizedItems = order.order_items || order.items || [];
  const fullOrder: OrderRecord = {
    ...order,
    items: normalizedItems,
    order_items: normalizedItems,
  };

  const existingIdx = sharedOrdersStore.findIndex((o) => o.id === fullOrder.id);
  if (existingIdx >= 0) {
    sharedOrdersStore[existingIdx] = fullOrder;
  } else {
    // Add to top of list
    sharedOrdersStore.unshift(fullOrder);
  }
}

/**
 * Get all stored orders from memory store
 */
export function getOrdersFromStore(): OrderRecord[] {
  return sharedOrdersStore;
}

/**
 * Update an order status in memory store
 */
export function updateOrderInStore(
  orderId: string,
  updates: Partial<OrderRecord>
) {
  const idx = sharedOrdersStore.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    sharedOrdersStore[idx] = {
      ...sharedOrdersStore[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return sharedOrdersStore[idx];
  }
  return null;
}

/**
 * Atomic conditional update for concurrency safety (e.g. READY -> DELIVERING)
 * Returns { success: true, order } if current status matches expectedStatus, otherwise { success: false, currentStatus }
 */
export function updateOrderInStoreConditional(
  orderId: string,
  updates: Partial<OrderRecord>,
  expectedStatus: string
): { success: boolean; order?: OrderRecord; currentStatus?: string } {
  const idx = sharedOrdersStore.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    return { success: false, currentStatus: undefined };
  }
  const current = sharedOrdersStore[idx];
  if (current.order_status !== expectedStatus) {
    return { success: false, currentStatus: current.order_status };
  }

  sharedOrdersStore[idx] = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return { success: true, order: sharedOrdersStore[idx] };
}


/**
 * Clear all stored orders from memory store
 */
export function clearOrdersStore() {
  sharedOrdersStore.length = 0;
}
