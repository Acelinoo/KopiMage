export interface TableInfo {
  id: string; // e.g. "01", "07", "15"
  name: string; // e.g. "Meja 01 (Indoor)", "Meja 07 (Terrace)"
  area?: 'Indoor' | 'Terrace' | 'VIP';
  active: boolean;
}

export const VALID_TABLES_REGISTRY: TableInfo[] = [
  { id: '01', name: 'Meja 01', area: 'Indoor', active: true },
  { id: '02', name: 'Meja 02', area: 'Indoor', active: true },
  { id: '03', name: 'Meja 03', area: 'Indoor', active: true },
  { id: '04', name: 'Meja 04', area: 'Indoor', active: true },
  { id: '05', name: 'Meja 05', area: 'Indoor', active: true },
  { id: '06', name: 'Meja 06', area: 'Terrace', active: true },
  { id: '07', name: 'Meja 07', area: 'Terrace', active: true },
  { id: '08', name: 'Meja 08', area: 'Terrace', active: true },
  { id: '09', name: 'Meja 09', area: 'Terrace', active: true },
  { id: '10', name: 'Meja 10', area: 'Terrace', active: true },
  { id: '11', name: 'Meja 11', area: 'VIP', active: true },
  { id: '12', name: 'Meja 12', area: 'VIP', active: true },
];
