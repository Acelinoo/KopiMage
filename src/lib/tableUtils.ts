/**
 * Table Normalization Utilities for Strict Customer Table Isolation Context
 */

/**
 * Normalizes a table ID/code into a consistent string for comparison.
 * e.g., "02" -> "2", "2" -> "2", "MEJA 02" -> "2"
 */
export function normalizeTableCode(tableId: string | null | undefined): string {
  if (!tableId) return '';
  const cleaned = String(tableId).trim();
  if (!cleaned) return '';
  
  // Extract trailing/embedded digits if possible
  const digitsOnly = cleaned.replace(/[^0-9]/g, '');
  if (digitsOnly) {
    const num = parseInt(digitsOnly, 10);
    if (!isNaN(num)) {
      return String(num);
    }
  }
  return cleaned.toLowerCase();
}

/**
 * Checks if two table identifiers represent the same physical table.
 * e.g., isSameTable("02", "2") === true
 *       isSameTable("01", "02") === false
 */
export function isSameTable(tableA: string | null | undefined, tableB: string | null | undefined): boolean {
  const normA = normalizeTableCode(tableA);
  const normB = normalizeTableCode(tableB);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Single source of truth for Active Customer Order status.
 * Active: NEW_ORDER, PREPARING, READY
 * Inactive: COMPLETED, CANCELLED, CANCELLATION_REQUESTED (after confirmation)
 */
export function isActiveCustomerOrder(order: any): boolean {
  if (!order || !order.id || !order.order_status) return false;
  const status = String(order.order_status).toUpperCase();
  return status === 'NEW_ORDER' || status === 'PREPARING' || status === 'READY';
}

/**
 * Helper to check if an order has reached terminal status (COMPLETED or CANCELLED)
 */
export function isCompletedOrCancelledOrder(order: any): boolean {
  if (!order || !order.order_status) return false;
  const status = String(order.order_status).toUpperCase();
  return status === 'COMPLETED' || status === 'CANCELLED';
}
