export type OrderMode = 'dine-in' | 'takeaway';
export type PaymentMethod = 'qris_static' | 'bank_transfer' | 'cashier';
export type OrderStatus =
  | 'verifying_payment' // QRIS / Transfer waiting for admin approval
  | 'new'               // Approved/Cashier order ready for Barista kitchen production
  | 'preparing'         // Barista is crafting the order
  | 'ready'             // Ready for waiter delivery / counter pickup
  | 'delivering'        // Waiter is delivering order to customer table
  | 'completed'         // Delivered to customer table
  | 'rejected'          // Payment proof rejected
  | 'cancelled'         // Cancelled by Admin/Barista
  | 'cancellation_requested'; // Customer requested cancellation, awaiting admin approval

export type DbOrderStatus =
  | 'NEW_ORDER'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLATION_REQUESTED';

export interface SelectedModifierOption {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
}

export interface OrderItemPayload {
  cartItemId: string; // Unique ID for cart entry (item + modifiers combination)
  menuItemId: string;
  name: string;
  basePrice: number;
  selectedModifiers: SelectedModifierOption[];
  unitPrice: number; // basePrice + sum(priceDelta)
  quantity: number;
  notes?: string;
}

export interface OrderPayload {
  orderId: string; // e.g. "KOP-20260812-007"
  clientOrderId?: string; // Idempotency key
  orderDisplayNumber?: string; // e.g. "#A127"
  mode: OrderMode;
  tableNumber?: string; // Validated table number for Dine-In
  customerName: string;
  customerPhone?: string;
  items: OrderItemPayload[];
  subtotal: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string; // Data URL or reference string for proof
  paymentStatus: 'unpaid' | 'paid_verified';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
