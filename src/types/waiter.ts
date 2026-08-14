import { TableStatusType } from './table';

export type WaiterRequestType = 'BANTUAN' | 'BILL' | 'LAINNYA';
export type WaiterRequestStatus = 'OPEN' | 'HANDLED' | 'COMPLETED';

export interface WaiterRequest {
  id: string;
  table_id: string; // UUID references tables(id)
  table_code: string; // e.g. "04"
  request_type: WaiterRequestType;
  status: WaiterRequestStatus;
  notes?: string;
  handled_by?: string;
  handled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FloorTableCard {
  id: string;
  code: string;
  name: string;
  area: 'Indoor' | 'Terrace' | 'VIP';
  active: boolean;
  status: TableStatusType;
  activeOrdersCount?: number;
  activeOrderNumber?: string;
  activeOrderDisplay?: string;
  pendingRequestsCount?: number;
  latestRequestType?: WaiterRequestType;
  latestRequestTime?: string;
}
