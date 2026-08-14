// Server-side in-memory shared store for Waiter Requests (Dual-layer resilience)
import { WaiterRequest, WaiterRequestType, WaiterRequestStatus } from '@/types/waiter';

// Global in-memory array across HMR invocations in Node server environment
const globalForWaiterRequests = globalThis as unknown as {
  sharedWaiterRequestsStore: WaiterRequest[];
};

export const sharedWaiterRequestsStore: WaiterRequest[] =
  globalForWaiterRequests.sharedWaiterRequestsStore || [];

if (process.env.NODE_ENV !== 'production') {
  globalForWaiterRequests.sharedWaiterRequestsStore = sharedWaiterRequestsStore;
}

/**
 * Add a new waiter request to memory store (with duplicate active check)
 */
export function addWaiterRequestToStore(request: WaiterRequest): { success: boolean; request: WaiterRequest; isDuplicate?: boolean } {
  // Check if an active (OPEN or HANDLED) request already exists for this table and request_type
  const existingActive = sharedWaiterRequestsStore.find(
    (r) =>
      r.table_code === request.table_code &&
      r.request_type === request.request_type &&
      r.status !== 'COMPLETED'
  );

  if (existingActive) {
    return { success: true, request: existingActive, isDuplicate: true };
  }

  sharedWaiterRequestsStore.unshift(request);
  return { success: true, request, isDuplicate: false };
}

/**
 * Get all waiter requests from memory store (with optional status filter)
 */
export function getWaiterRequestsFromStore(statusFilter?: string, tableCode?: string): WaiterRequest[] {
  let list = [...sharedWaiterRequestsStore];

  if (tableCode) {
    list = list.filter((r) => r.table_code === tableCode);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter((r) => r.status === statusFilter);
  }

  return list;
}

/**
 * Atomic conditional update for waiter request status (concurrency safe)
 */
export function updateWaiterRequestInStoreConditional(
  requestId: string,
  updates: Partial<WaiterRequest>,
  expectedStatus: WaiterRequestStatus
): { success: boolean; request?: WaiterRequest; currentStatus?: WaiterRequestStatus } {
  const idx = sharedWaiterRequestsStore.findIndex((r) => r.id === requestId);
  if (idx === -1) {
    return { success: false, currentStatus: undefined };
  }

  const current = sharedWaiterRequestsStore[idx];
  if (current.status !== expectedStatus) {
    return { success: false, currentStatus: current.status };
  }

  sharedWaiterRequestsStore[idx] = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return { success: true, request: sharedWaiterRequestsStore[idx] };
}

/**
 * Clear all stored requests (for testing/cleanup)
 */
export function clearWaiterRequestsStore() {
  sharedWaiterRequestsStore.length = 0;
}
