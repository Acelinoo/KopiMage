'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VALID_TABLES_REGISTRY, TableInfo, TableStatusType } from '@/types/table';
import { WaiterRequest, FloorTableCard } from '@/types/waiter';
import { isSameTable, isActiveCustomerOrder } from '@/lib/tableUtils';
import {
  Coffee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Bell,
  Utensils,
  MapPin,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  User,
  ShoppingBag,
  Flame,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WaiterFloorPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'FLOOR' | 'READY' | 'REQUESTS'>('FLOOR');
  const [orders, setOrders] = useState<any[]>([]);
  const [tablesList, setTablesList] = useState<TableInfo[]>(VALID_TABLES_REGISTRY);
  const [requestsList, setRequestsList] = useState<WaiterRequest[]>([]);
  const [selectedTable, setSelectedTable] = useState<FloorTableCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'Indoor' | 'Terrace' | 'VIP'>('ALL');

  // Fetch Live Orders and Tables from Server API
  const fetchFloorData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      // 1. Fetch Orders
      const ordersRes = await fetch(`/api/admin/orders?status=ALL&t=${Date.now()}`);
      const ordersData = await ordersRes.json();
      if (ordersData.success && Array.isArray(ordersData.orders)) {
        setOrders(ordersData.orders);
      }

      // 2. Fetch Tables (with fallback to VALID_TABLES_REGISTRY)
      try {
        const tablesRes = await fetch(`/api/tables?t=${Date.now()}`);
        const tablesData = await tablesRes.json();
        if (tablesData.success && Array.isArray(tablesData.tables) && tablesData.tables.length > 0) {
          setTablesList(tablesData.tables);
        }
      } catch (e) {
        // Fallback to static registry
      }
    } catch (err) {
      console.error('Failed to fetch waiter floor data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFloorData(true);

    // Live fast polling interval (3.5 seconds)
    const interval = setInterval(() => fetchFloorData(false), 3500);

    // Supabase Realtime Listener (using existing channel pattern)
    let channel: any = null;
    try {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        channel = supabase
          .channel('waiter-realtime-floor')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            fetchFloorData(false);
          })
          .subscribe();
      });
    } catch (e) {
      console.warn('Realtime channel fallback:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          import('@/lib/supabase/client').then(({ createClient }) => {
            createClient().removeChannel(channel);
          });
        } catch (e) {}
      }
    };
  }, []);

  // Filter Ready Orders (ready to be picked up from counter)
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.order_status === 'READY');
  }, [orders]);

  // Filter Active Waiter Requests (OPEN or HANDLED)
  const activeRequests = useMemo(() => {
    return requestsList.filter((r) => r.status !== 'COMPLETED');
  }, [requestsList]);

  // Compute Floor Table Cards Matrix with Multi-Priority Status
  const floorTables = useMemo<FloorTableCard[]>(() => {
    const baseTables = tablesList.length > 0 ? tablesList : VALID_TABLES_REGISTRY;

    return baseTables.map((tbl) => {
      const tableCode = String(tbl.code || tbl.id).padStart(2, '0');
      const cleanTableId = String(parseInt(tableCode, 10) || tableCode);

      // 1. Check for pending requests for this table (Priority 1: BUTUH_BANTUAN)
      const tableRequest = activeRequests.find((r) => isSameTable(r.table_code, tableCode));

      // 2. Check for active orders for this table (Priority 3: PESANAN_DIPROSES)
      const tableOrders = orders.filter((o) => isSameTable(o.table_id || o.table_code, tableCode));
      const activeOrder = tableOrders.find((o) => isActiveCustomerOrder(o));
      const latestCompletedOrder = tableOrders.find((o) => o.order_status === 'COMPLETED');

      let computedStatus: TableStatusType = 'KOSONG';

      if (tableRequest) {
        computedStatus = 'BUTUH_BANTUAN';
      } else if (tbl.status === 'PERLU_DIBERSIHKAN') {
        computedStatus = 'PERLU_DIBERSIHKAN';
      } else if (activeOrder) {
        computedStatus = 'PESANAN_DIPROSES';
      } else if (latestCompletedOrder) {
        computedStatus = 'SEDANG_MAKAN';
      } else {
        computedStatus = tbl.status || 'KOSONG';
      }

      return {
        id: String(tbl.id),
        code: tableCode,
        name: tbl.name || `Meja ${cleanTableId}`,
        area: (tbl.area as any) || 'Indoor',
        active: tbl.active !== false,
        status: computedStatus,
        activeOrdersCount: tableOrders.filter((o) => isActiveCustomerOrder(o)).length,
        activeOrderNumber: activeOrder?.order_number,
        activeOrderDisplay: activeOrder?.order_display_number || (activeOrder?.order_number ? `#${activeOrder.order_number.slice(-3)}` : undefined),
        pendingRequestsCount: tableRequest ? 1 : 0,
        latestRequestType: tableRequest?.request_type,
        latestRequestTime: tableRequest?.created_at,
      };
    });
  }, [tablesList, orders, activeRequests]);

  // Filter floor tables by area
  const filteredFloorTables = useMemo(() => {
    if (areaFilter === 'ALL') return floorTables;
    return floorTables.filter((t) => t.area === areaFilter);
  }, [floorTables, areaFilter]);

  // Floor KPI Counts
  const readyOrdersCount = readyOrders.length;
  const activeRequestsCount = activeRequests.length;
  const needsCleaningCount = floorTables.filter((t) => t.status === 'PERLU_DIBERSIHKAN').length;
  const inProgressCount = floorTables.filter((t) => t.status === 'PESANAN_DIPROSES').length;

  // Visual Styling Helper per Table Status
  const getStatusBadgeStyle = (status: TableStatusType) => {
    switch (status) {
      case 'BUTUH_BANTUAN':
        return {
          label: 'BUTUH BANTUAN',
          icon: Bell,
          bg: isDark ? 'rgba(241, 196, 15, 0.15)' : '#FEF9E7',
          border: '#F1C40F',
          text: '#D4AC0D',
          badgeText: isDark ? '#F1C40F' : '#B7950B',
          isUrgent: true,
        };
      case 'PERLU_DIBERSIHKAN':
        return {
          label: 'PERLU DIBERSIHKAN',
          icon: Sparkles,
          bg: isDark ? 'rgba(231, 76, 60, 0.15)' : '#FDEDEC',
          border: '#E74C3C',
          text: '#C0392B',
          badgeText: isDark ? '#E74C3C' : '#C0392B',
          isUrgent: true,
        };
      case 'PESANAN_DIPROSES':
        return {
          label: 'PESANAN DIPROSES',
          icon: Flame,
          bg: isDark ? 'rgba(52, 152, 219, 0.15)' : '#EBF5FB',
          border: '#3498DB',
          text: '#2980B9',
          badgeText: isDark ? '#5DADE2' : '#2471A3',
          isUrgent: false,
        };
      case 'SEDANG_MAKAN':
        return {
          label: 'SEDANG MAKAN',
          icon: Utensils,
          bg: isDark ? 'rgba(155, 89, 182, 0.15)' : '#F4ECF7',
          border: '#9B59B6',
          text: '#8E44AD',
          badgeText: isDark ? '#AF7AC5' : '#7D3C98',
          isUrgent: false,
        };
      case 'TERISI':
        return {
          label: 'TERISI',
          icon: User,
          bg: isDark ? 'rgba(230, 126, 34, 0.15)' : '#FBEEE6',
          border: '#E67E22',
          text: '#D35400',
          badgeText: isDark ? '#EB984E' : '#BA4A00',
          isUrgent: false,
        };
      case 'KOSONG':
      default:
        return {
          label: 'KOSONG',
          icon: CheckCheck,
          bg: isDark ? '#161210' : '#FFFFFF',
          border: isDark ? 'rgba(255, 255, 255, 0.12)' : '#9E1F1F',
          text: isDark ? '#A89F91' : '#666666',
          badgeText: isDark ? '#27AE60' : '#1E8449',
          isUrgent: false,
        };
    }
  };

  return (
    <div
      style={{
        background: isDark ? '#0E0B0A' : '#9E1F1F',
        color: isDark ? '#F7F4EF' : '#FFFFFF',
        minHeight: '100vh',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
      className="font-sans pb-24 selection:bg-[#B82E2E] selection:text-white"
    >
      {/* 1. COMPACT WAITER HEADER (Mobile-First) */}
      <header
        style={{
          background: isDark ? '#161210' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
          boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.12)',
        }}
        className="sticky top-0 z-40 backdrop-blur-md px-4 py-3 sm:px-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{ background: '#9E1F1F' }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
            >
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                  className="text-[0.65rem] font-mono uppercase tracking-widest font-bold"
                >
                  WAITER / FLOOR SYSTEM
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1
                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                className="text-base sm:text-lg font-serif font-bold tracking-tight"
              >
                Pramusaji &amp; Kontrol Meja
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => fetchFloorData(false)}
              disabled={isRefreshing}
              style={{
                background: isDark ? '#0E0B0A' : '#FAF7F5',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#9E1F1F',
                color: isDark ? '#FFFFFF' : '#9E1F1F',
              }}
              className="p-2 rounded-xl border hover:opacity-80 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Data Floor"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. OPERATIONAL SUMMARY KPI BAR (One-Hand Priority Counters) */}
      <div className="max-w-6xl mx-auto px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          {/* KPI 1: Ready Orders */}
          <button
            onClick={() => setActiveTab('READY')}
            style={{
              background: activeTab === 'READY'
                ? (isDark ? '#2C1D11' : '#FFFFFF')
                : (isDark ? '#161210' : '#FFFFFF'),
              border: readyOrdersCount > 0
                ? '2px solid #E67E22'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F'),
              boxShadow: readyOrdersCount > 0 ? '0 0 15px rgba(230, 126, 34, 0.25)' : 'none',
            }}
            className="p-3 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-[0.62rem] font-mono font-bold uppercase truncate">
                SIAP DIANTAR
              </span>
              <ShoppingBag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-serif font-black text-orange-500">
                {readyOrdersCount}
              </span>
              <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.65rem] font-mono">
                Order
              </span>
            </div>
          </button>

          {/* KPI 2: Active Requests */}
          <button
            onClick={() => setActiveTab('REQUESTS')}
            style={{
              background: activeTab === 'REQUESTS'
                ? (isDark ? '#2C2711' : '#FFFFFF')
                : (isDark ? '#161210' : '#FFFFFF'),
              border: activeRequestsCount > 0
                ? '2px solid #F1C40F'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F'),
              boxShadow: activeRequestsCount > 0 ? '0 0 15px rgba(241, 196, 15, 0.25)' : 'none',
            }}
            className="p-3 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-[0.62rem] font-mono font-bold uppercase truncate">
                PANGGILAN
              </span>
              <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-serif font-black text-amber-400">
                {activeRequestsCount}
              </span>
              <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.65rem] font-mono">
                Req
              </span>
            </div>
          </button>

          {/* KPI 3: Needs Cleaning */}
          <button
            onClick={() => {
              setActiveTab('FLOOR');
            }}
            style={{
              background: isDark ? '#161210' : '#FFFFFF',
              border: needsCleaningCount > 0
                ? '2px solid #E74C3C'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F'),
            }}
            className="p-3 rounded-2xl text-left transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-[0.62rem] font-mono font-bold uppercase truncate">
                PERLU BERSIH
              </span>
              <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-serif font-black text-rose-500">
                {needsCleaningCount}
              </span>
              <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.65rem] font-mono">
                Meja
              </span>
            </div>
          </button>
        </div>

        {/* 3. MAIN NAVIGATION TABS (Floor vs Ready Orders vs Requests) */}
        <div
          style={{
            background: isDark ? '#161210' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
          }}
          className="flex items-center gap-1.5 p-1 rounded-2xl mb-4 shadow-sm"
        >
          <button
            onClick={() => setActiveTab('FLOOR')}
            style={{
              background: activeTab === 'FLOOR' ? '#9E1F1F' : 'transparent',
              color: activeTab === 'FLOOR' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
            }}
            className="flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FLOOR MATRIX ({floorTables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('READY')}
            style={{
              background: activeTab === 'READY' ? '#9E1F1F' : 'transparent',
              color: activeTab === 'READY' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
            }}
            className="flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>SIAP DIANTAR ({readyOrdersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            style={{
              background: activeTab === 'REQUESTS' ? '#9E1F1F' : 'transparent',
              color: activeTab === 'REQUESTS' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
            }}
            className="flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>PANGGILAN ({activeRequestsCount})</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT VIEW */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* VIEW 1: FLOOR MATRIX */}
        {activeTab === 'FLOOR' && (
          <section>
            {/* Area Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {(['ALL', 'Indoor', 'Terrace', 'VIP'] as const).map((area) => (
                <button
                  key={area}
                  onClick={() => setAreaFilter(area)}
                  style={{
                    background: areaFilter === area ? '#9E1F1F' : (isDark ? '#161210' : '#FFFFFF'),
                    border: areaFilter === area ? '1px solid #9E1F1F' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F'),
                    color: areaFilter === area ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  }}
                  className="px-3 py-1 rounded-xl text-[0.7rem] font-mono font-bold uppercase transition-all cursor-pointer shrink-0"
                >
                  {area === 'ALL' ? 'SEMUA AREA' : area}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-7 h-7 text-white animate-spin mb-2" />
                <p style={{ color: isDark ? '#A89F91' : '#FFFFFF' }} className="text-xs font-mono">
                  Memuat data matriks meja KOPIMAGE...
                </p>
              </div>
            ) : filteredFloorTables.length === 0 ? (
              <div
                style={{
                  background: isDark ? '#161210' : '#FFFFFF',
                  border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px dashed #9E1F1F',
                }}
                className="py-16 text-center rounded-2xl p-6"
              >
                <Layers style={{ color: isDark ? '#A89F91' : '#9E1F1F' }} className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <h3 style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-sm font-serif font-bold">
                  Tidak Ada Meja Dalam Area Ini
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFloorTables.map((tbl) => {
                  const badge = getStatusBadgeStyle(tbl.status);
                  const Icon = badge.icon;

                  return (
                    <motion.div
                      key={tbl.id}
                      layout
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedTable(tbl)}
                      style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        border: badge.isUrgent
                          ? `2px solid ${badge.border}`
                          : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #9E1F1F'),
                        boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.08)',
                      }}
                      className="p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer hover:-translate-y-0.5 transition-all relative overflow-hidden"
                    >
                      {/* Top Header: Code & Area */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                            className="font-serif text-2xl font-black tracking-tight"
                          >
                            {tbl.code}
                          </span>
                          <span
                            style={{ color: isDark ? '#A89F91' : '#666666' }}
                            className="text-[0.62rem] font-mono uppercase truncate"
                          >
                            {tbl.area}
                          </span>
                        </div>

                        {/* Status Label Teks Wajib */}
                        <div
                          style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                          }}
                          className="px-2 py-1 rounded-lg flex items-center gap-1.5 mb-2"
                        >
                          <Icon style={{ color: badge.text }} className="w-3 h-3 shrink-0" />
                          <span
                            style={{ color: badge.badgeText }}
                            className="text-[0.62rem] font-mono font-bold tracking-tight truncate uppercase"
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Context Details */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[0.65rem] font-mono">
                        {tbl.activeOrderDisplay ? (
                          <span className="text-orange-400 font-bold truncate">
                            {tbl.activeOrderDisplay}
                          </span>
                        ) : tbl.status === 'PERLU_DIBERSIHKAN' ? (
                          <span className="text-rose-400 font-bold">Siap dilap</span>
                        ) : (
                          <span style={{ color: isDark ? '#777777' : '#888888' }}>Siap pakai</span>
                        )}
                        <ChevronRight style={{ color: isDark ? '#666666' : '#9E1F1F' }} className="w-3.5 h-3.5 shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: READY ORDERS (Siap Diantar dari Counter) */}
        {activeTab === 'READY' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 style={{ color: isDark ? '#FFFFFF' : '#FFFFFF' }} className="text-sm font-serif font-bold">
                  Daftar Pesanan Siap Diantar (Ready to Serve)
                </h2>
                <p style={{ color: isDark ? '#A89F91' : '#F3EFEA' }} className="text-[0.7rem] font-mono">
                  Pesanan yang sudah selesai dibuat Barista/Dapur di pickup counter.
                </p>
              </div>
            </div>

            {readyOrders.length === 0 ? (
              <div
                style={{
                  background: isDark ? '#161210' : '#FFFFFF',
                  border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px dashed #9E1F1F',
                }}
                className="py-16 text-center rounded-2xl p-6"
              >
                <CheckCircle2 style={{ color: isDark ? '#A89F91' : '#9E1F1F' }} className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <h3 style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-sm font-serif font-bold mb-0.5">
                  Tidak Ada Pesanan yang Siap Diantar
                </h3>
                <p style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-xs font-mono">
                  Semua pesanan yang matang telah disajikan ke meja customer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {readyOrders.map((order) => {
                  const itemsList = order.items || order.order_items || [];
                  const cleanTable =
                    order.table_code ||
                    (order.tables?.code && !order.tables.code.includes('-') ? order.tables.code : null) ||
                    (order.table_id && !String(order.table_id).includes('-') ? order.table_id : '01');

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        border: '2px solid #E67E22',
                        boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.1)',
                      }}
                      className="p-4 rounded-2xl transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-lg font-serif font-black text-orange-500">
                              MEJA {cleanTable}
                            </span>
                            <span
                              style={{ color: isDark ? '#A89F91' : '#666666' }}
                              className="text-[0.65rem] font-mono font-bold"
                            >
                              {order.order_display_number || order.order_number}
                            </span>
                          </div>
                          <span style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} className="text-xs font-mono font-bold block">
                            Atas Nama: {order.customer_name}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[0.65rem] font-mono font-bold uppercase">
                          READY DI COUNTER
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div
                        style={{
                          background: isDark ? '#0E0B0A' : '#FAF7F5',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(158, 31, 31, 0.12)',
                        }}
                        className="p-2.5 rounded-xl mb-3 space-y-1 text-xs"
                      >
                        {itemsList.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="font-medium">
                              {it.quantity}x {it.item_name || it.name}
                            </span>
                            {it.notes && (
                              <span style={{ color: isDark ? '#A89F91' : '#777777' }} className="text-[0.68rem] italic truncate max-w-[140px]">
                                "{it.notes}"
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Button Preview (Phase 2 UI Placeholder - Phase 3 will activate mutation) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.68rem] font-mono">
                          Total: {itemsList.length} Item
                        </span>
                        <button
                          disabled
                          style={{
                            background: '#9E1F1F',
                            color: '#FFFFFF',
                            opacity: 0.9,
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-not-allowed shadow-md"
                          title="Aksi pengantaran aktif di Fase 3"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>AMBIL &amp; ANTAR KE MEJA (FASE 3)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: WAITER REQUESTS (Panggilan Meja) */}
        {activeTab === 'REQUESTS' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 style={{ color: isDark ? '#FFFFFF' : '#FFFFFF' }} className="text-sm font-serif font-bold">
                  Panggilan &amp; Permintaan Bantuan Meja
                </h2>
                <p style={{ color: isDark ? '#A89F91' : '#F3EFEA' }} className="text-[0.7rem] font-mono">
                  Daftar customer yang memanggil waiter dari meja.
                </p>
              </div>
            </div>

            {activeRequests.length === 0 ? (
              <div
                style={{
                  background: isDark ? '#161210' : '#FFFFFF',
                  border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px dashed #9E1F1F',
                }}
                className="py-16 text-center rounded-2xl p-6"
              >
                <Bell style={{ color: isDark ? '#A89F91' : '#9E1F1F' }} className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <h3 style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-sm font-serif font-bold mb-0.5">
                  Tidak Ada Panggilan Waiter
                </h3>
                <p style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-xs font-mono">
                  Belum ada customer yang meminta bantuan atau tagihan bill.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: isDark ? '#161210' : '#FFFFFF',
                      border: '2px solid #F1C40F',
                      boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.1)',
                    }}
                    className="p-4 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-serif font-black text-amber-400">
                          MEJA {req.table_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-400 text-[0.62rem] font-mono font-bold uppercase">
                          {req.request_type === 'BILL' ? 'MINTA BILL' : 'MINTA BANTUAN'}
                        </span>
                      </div>
                      <p style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-xs font-mono">
                        {req.notes || 'Customer membutuhkan bantuan staf di meja.'}
                      </p>
                    </div>

                    <button
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400 text-xs font-mono font-bold uppercase cursor-not-allowed"
                      title="Aksi penanganan aktif di Fase 4"
                    >
                      TANGANI (FASE 4)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* 5. TABLE DETAIL MODAL (Bottom Sheet / Modal) */}
      <AnimatePresence>
        {selectedTable && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '2px solid #9E1F1F',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-2xl font-serif font-black">
                      {selectedTable.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#9E1F1F] text-white text-[0.62rem] font-mono font-bold uppercase">
                      {selectedTable.area}
                    </span>
                  </div>
                  <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-xs font-mono">
                    Status Saat Ini: <strong className="uppercase">{selectedTable.status}</strong>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedTable(null)}
                  style={{
                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }}
                  className="p-2 rounded-xl cursor-pointer hover:opacity-80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              {(() => {
                const b = getStatusBadgeStyle(selectedTable.status);
                const BIcon = b.icon;
                return (
                  <div
                    style={{ background: b.bg, border: `1px solid ${b.border}` }}
                    className="p-3 rounded-xl flex items-center gap-2.5 mb-4"
                  >
                    <BIcon style={{ color: b.text }} className="w-5 h-5 shrink-0" />
                    <div>
                      <span style={{ color: b.badgeText }} className="text-xs font-mono font-bold block uppercase">
                        {b.label}
                      </span>
                      <p style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-[0.72rem] font-sans">
                        {selectedTable.status === 'KOSONG'
                          ? 'Meja bersih dan siap digunakan untuk tamu baru.'
                          : selectedTable.status === 'PESANAN_DIPROSES'
                          ? 'Ada pesanan aktif yang sedang diproses.'
                          : selectedTable.status === 'SEDANG_MAKAN'
                          ? 'Pesanan sudah disajikan ke meja customer.'
                          : selectedTable.status === 'BUTUH_BANTUAN'
                          ? 'Customer sedang memanggil waiter di meja ini.'
                          : 'Tamu sudah selesai, meja perlu dibersihkan & dilap.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Table Action Controls Placeholder (Phase 3 & 4 Preview) */}
              <div className="space-y-2 pt-2">
                <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.68rem] font-mono uppercase font-bold block">
                  AKSI OPERASIONAL WAITER (PREVIEW FASE 3/4):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled
                    style={{
                      background: isDark ? '#0E0B0A' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                      color: isDark ? '#A89F91' : '#666666',
                    }}
                    className="p-2.5 rounded-xl text-xs font-mono font-bold uppercase cursor-not-allowed opacity-75"
                  >
                    TANDAI BERSIH / KOSONG
                  </button>
                  <button
                    disabled
                    style={{
                      background: isDark ? '#0E0B0A' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                      color: isDark ? '#A89F91' : '#666666',
                    }}
                    className="p-2.5 rounded-xl text-xs font-mono font-bold uppercase cursor-not-allowed opacity-75"
                  >
                    PERLU DIBERSIHKAN
                  </button>
                </div>
              </div>

              {/* Close CTA */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedTable(null)}
                  style={{ background: '#9E1F1F', color: '#FFFFFF' }}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md"
                >
                  TUTUP DETAIL MEJA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
