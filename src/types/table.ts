export type TableStatusType =
  | 'KOSONG'            // Meja bersih, siap digunakan customer baru
  | 'TERISI'            // Meja terisi (opsional future compatibility)
  | 'PESANAN_DIPROSES'  // Ada pesanan aktif yang sedang dibuat / diantar
  | 'SEDANG_MAKAN'      // Seluruh pesanan sudah disajikan ke meja
  | 'BUTUH_BANTUAN'     // Customer menekan Panggil Waiter / Minta Bill
  | 'PERLU_DIBERSIHKAN';// Customer selesai/beranjak, siap dibersihkan

export interface TableInfo {
  id: string; // e.g. "01", "07", "15" atau UUID
  code?: string; // e.g. "01", "07"
  name: string; // e.g. "Meja 01", "Meja 07"
  area?: 'Indoor' | 'Terrace' | 'VIP';
  active: boolean;
  status?: TableStatusType;
}

export const VALID_TABLES_REGISTRY: TableInfo[] = [
  { id: '01', code: '01', name: 'Meja 01', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '02', code: '02', name: 'Meja 02', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '03', code: '03', name: 'Meja 03', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '04', code: '04', name: 'Meja 04', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '05', code: '05', name: 'Meja 05', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '06', code: '06', name: 'Meja 06', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '07', code: '07', name: 'Meja 07', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '08', code: '08', name: 'Meja 08', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '09', code: '09', name: 'Meja 09', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '10', code: '10', name: 'Meja 10', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '11', code: '11', name: 'Meja 11', area: 'VIP', active: true, status: 'KOSONG' },
  { id: '12', code: '12', name: 'Meja 12', area: 'VIP', active: true, status: 'KOSONG' },
  { id: '13', code: '13', name: 'Meja 13', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '14', code: '14', name: 'Meja 14', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '15', code: '15', name: 'Meja 15', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '16', code: '16', name: 'Meja 16', area: 'Terrace', active: true, status: 'KOSONG' },
  { id: '17', code: '17', name: 'Meja 17', area: 'VIP', active: true, status: 'KOSONG' },
  { id: '18', code: '18', name: 'Meja 18', area: 'VIP', active: true, status: 'KOSONG' },
  { id: '19', code: '19', name: 'Meja 19', area: 'Indoor', active: true, status: 'KOSONG' },
  { id: '20', code: '20', name: 'Meja 20', area: 'Terrace', active: true, status: 'KOSONG' },
];
