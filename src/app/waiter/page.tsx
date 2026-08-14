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
  CheckCheck,
  Send,
  Loader2,
  Check
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
  
  // Action Loading & Toast States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss alert notification after 4 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Fetch Live Orders, Tables, and Requests from Server API
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
      } catch (e) {}

      // 3. Fetch Waiter Requests
      try {
        const reqRes = await fetch(`/api/waiter/requests?t=${Date.now()}`);
        const reqData = await reqRes.json();
        if (reqData.success && Array.isArray(reqData.requests)) {
          setRequestsList(reqData.requests);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to fetch waiter floor data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFloorData(true);

    // 1. Supabase Realtime Single Managed Hub (orders, waiter_requests, tables)
    let channel: any = null;
    let isSubscribed = false;

    try {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        
        channel = supabase
          .channel('waiter-realtime-hub')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              fetchFloorData(false);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'waiter_requests' },
            () => {
              fetchFloorData(false);
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tables' },
            () => {
              fetchFloorData(false);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              // Authoritative catch-up refetch upon connect/reconnect
              fetchFloorData(false);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              isSubscribed = false;
            }
          });
      });
    } catch (e) {
      console.warn('Realtime channel fallback error:', e);
    }

    // 2. Slow Heartbeat Polling Fallback (15 seconds) as safety net for mobile network drops
    const heartbeatInterval = setInterval(() => {
      fetchFloorData(false);
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      if (channel) {
        try {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.removeChannel(channel);
          });
        } catch (e) {}
      }
    };
  }, []);

  // Filter Ready Orders (ready to be picked up from counter)
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.order_status === 'READY');
  }, [orders]);

  // Filter In-Transit Delivering Orders (being delivered to table by waiter)
  const deliveringOrders = useMemo(() => {
    return orders.filter((o) => o.order_status === 'DELIVERING');
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
  const deliveringOrdersCount = deliveringOrders.length;
  const activeRequestsCount = activeRequests.length;
  const needsCleaningCount = floorTables.filter((t) => t.status === 'PERLU_DIBERSIHKAN').length;

  // ----------------------------------------------------
  // Phase 3 Delivery Mutation Handlers (With Concurrency Lock)
  // ----------------------------------------------------

  // 1. Claim & Start Delivery: READY -> DELIVERING (Conditional Atomic Lock)
  const handleStartDelivery = async (orderId: string, tableCode: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: 'DELIVERING',
          expected_current_status: 'READY',
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setAlertMessage({
          type: 'error',
          text: data.error || `Pesanan Meja ${tableCode} sudah diambil oleh rekan waiter lain.`,
        });
        fetchFloorData(false);
      } else if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: `Pesanan Meja ${tableCode} diambil. Sedang diantar ke meja customer.`,
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: 'DELIVERING' } : o))
        );
        fetchFloorData(false);
      } else {
        setAlertMessage({
          type: 'error',
          text: data.error || 'Gagal memulai pengantaran.',
        });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: 'Koneksi bermasalah: ' + err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Complete Delivery at Customer Table: DELIVERING -> COMPLETED
  const handleCompleteServed = async (orderId: string, tableCode: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: 'COMPLETED',
          expected_current_status: 'DELIVERING',
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setAlertMessage({
          type: 'error',
          text: data.error || `Status pesanan Meja ${tableCode} telah diperbarui sebelumnya.`,
        });
        fetchFloorData(false);
      } else if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: `Pesanan Meja ${tableCode} telah disajikan! Status meja: SEDANG MAKAN.`,
        });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: 'COMPLETED' } : o))
        );
        if (selectedTable) setSelectedTable(null);
        fetchFloorData(false);
      } else {
        setAlertMessage({
          type: 'error',
          text: data.error || 'Gagal mengonfirmasi penyajian.',
        });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: 'Koneksi bermasalah: ' + err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ----------------------------------------------------
  // Phase 4 Waiter Request Handlers (With Concurrency Lock)
  // ----------------------------------------------------

  // 3. Handle Request: OPEN -> HANDLED (Atomic Lock)
  const handleStartHandlingRequest = async (requestId: string, tableCode: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch('/api/waiter/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status: 'HANDLED',
          expected_current_status: 'OPEN',
          handled_by: 'Staf Waiter',
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setAlertMessage({
          type: 'error',
          text: data.error || `Panggilan Meja ${tableCode} sudah diambil oleh staf lain.`,
        });
        fetchFloorData(false);
      } else if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: `Panggilan Meja ${tableCode} sedang Anda tangani.`,
        });
        setRequestsList((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'HANDLED', handled_by: 'Staf Waiter' } : r))
        );
        fetchFloorData(false);
      } else {
        setAlertMessage({
          type: 'error',
          text: data.error || 'Gagal menangani panggilan.',
        });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: 'Koneksi bermasalah: ' + err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Complete Request: HANDLED -> COMPLETED
  const handleCompleteRequest = async (requestId: string, tableCode: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch('/api/waiter/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status: 'COMPLETED',
          expected_current_status: 'HANDLED',
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setAlertMessage({
          type: 'error',
          text: data.error || `Status panggilan Meja ${tableCode} telah diperbarui sebelumnya.`,
        });
        fetchFloorData(false);
      } else if (res.ok) {
        setAlertMessage({
          type: 'success',
          text: `Panggilan Meja ${tableCode} selesai ditangani!`,
        });
        setRequestsList((prev) => prev.filter((r) => r.id !== requestId));
        if (selectedTable) setSelectedTable(null);
        fetchFloorData(false);
      } else {
        setAlertMessage({
          type: 'error',
          text: data.error || 'Gagal menyelesaikan panggilan.',
        });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: 'Koneksi bermasalah: ' + err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

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
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: alertMessage.type === 'success' ? '#27AE60' : '#E74C3C',
              color: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 max-w-md w-[90%]"
          >
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{alertMessage.text}</span>
            <button onClick={() => setAlertMessage(null)} className="opacity-75 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* KPI 1: Ready & Delivering Orders */}
          <button
            onClick={() => setActiveTab('READY')}
            style={{
              background: activeTab === 'READY'
                ? (isDark ? '#2C1D11' : '#FFFFFF')
                : (isDark ? '#161210' : '#FFFFFF'),
              border: (readyOrdersCount > 0 || deliveringOrdersCount > 0)
                ? '2px solid #E67E22'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F'),
              boxShadow: (readyOrdersCount > 0 || deliveringOrdersCount > 0) ? '0 0 15px rgba(230, 126, 34, 0.25)' : 'none',
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
              {deliveringOrdersCount > 0 && (
                <span className="text-[0.68rem] font-mono font-bold text-amber-500">
                  (+{deliveringOrdersCount})
                </span>
              )}
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
                Aktif
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
            <span>SIAP DIANTAR ({readyOrdersCount + deliveringOrdersCount})</span>
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
                        {tbl.status === 'BUTUH_BANTUAN' ? (
                          <span className="text-amber-400 font-bold truncate">
                            {tbl.latestRequestType === 'BILL' ? 'Minta Bill' : 'Panggil Staf'}
                          </span>
                        ) : tbl.activeOrderDisplay ? (
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

        {/* VIEW 2: READY & DELIVERING ORDERS (Siap Diantar & Sedang Diantar) */}
        {activeTab === 'READY' && (
          <section className="space-y-6">
            {/* SUBSECTION 1: READY ORDERS (Di Pickup Counter) */}
            <div>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h2 style={{ color: '#FFFFFF' }} className="text-sm font-serif font-bold">
                    1. Siap Diambil di Counter ({readyOrders.length})
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
                <p style={{ color: isDark ? '#A89F91' : '#F3EFEA' }} className="text-[0.7rem] font-mono">
                  Barista telah membunyikan bel. Ambil nampan lalu tekan "Ambil &amp; Antar".
                </p>
              </div>

              {readyOrders.length === 0 ? (
                <div
                  style={{
                    background: isDark ? '#161210' : '#FFFFFF',
                    border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px dashed #9E1F1F',
                  }}
                  className="py-10 text-center rounded-2xl p-6 mb-4"
                >
                  <CheckCircle2 style={{ color: isDark ? '#A89F91' : '#9E1F1F' }} className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <h3 style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-sm font-serif font-bold mb-0.5">
                    Tidak Ada Pesanan Baru di Counter
                  </h3>
                  <p style={{ color: isDark ? '#A89F91' : '#555555' }} className="text-xs font-mono">
                    Semua pesanan yang matang telah diambil oleh tim floor.
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

                    const isLoading = actionLoadingId === order.id;

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
                              <span className="text-xl font-serif font-black text-orange-500">
                                MEJA {cleanTable}
                              </span>
                              <span
                                style={{ color: isDark ? '#A89F91' : '#666666' }}
                                className="text-[0.68rem] font-mono font-bold"
                              >
                                {order.order_display_number || order.order_number}
                              </span>
                            </div>
                            <span style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} className="text-xs font-mono font-bold block">
                              Customer: {order.customer_name}
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[0.65rem] font-mono font-bold uppercase">
                            🔔 READY DI COUNTER
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

                        {/* Active Action Button */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.68rem] font-mono">
                            Total: {itemsList.length} Item
                          </span>
                          <button
                            onClick={() => handleStartDelivery(order.id, cleanTable)}
                            disabled={isLoading}
                            style={{
                              background: '#9E1F1F',
                              color: '#FFFFFF',
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:bg-[#B82E2E] active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5" />
                            )}
                            <span>AMBIL &amp; ANTAR KE MEJA</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SUBSECTION 2: DELIVERING ORDERS (Sedang Diantar ke Meja) */}
            {deliveringOrders.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h2 style={{ color: '#FFFFFF' }} className="text-sm font-serif font-bold">
                      2. Sedang Diantar ke Meja ({deliveringOrders.length})
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <p style={{ color: isDark ? '#A89F91' : '#F3EFEA' }} className="text-[0.7rem] font-mono">
                    Pesanan sedang dibawa menuju meja. Tekan "Sudah Disajikan" setelah ditaruh di meja customer.
                  </p>
                </div>

                <div className="space-y-3">
                  {deliveringOrders.map((order) => {
                    const itemsList = order.items || order.order_items || [];
                    const cleanTable =
                      order.table_code ||
                      (order.tables?.code && !order.tables.code.includes('-') ? order.tables.code : null) ||
                      (order.table_id && !String(order.table_id).includes('-') ? order.table_id : '01');

                    const isLoading = actionLoadingId === order.id;

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: isDark ? '#161210' : '#FFFFFF',
                          border: '2px solid #F39C12',
                          boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.1)',
                        }}
                        className="p-4 rounded-2xl transition-all relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xl font-serif font-black text-amber-500">
                                MEJA {cleanTable}
                              </span>
                              <span
                                style={{ color: isDark ? '#A89F91' : '#666666' }}
                                className="text-[0.68rem] font-mono font-bold"
                              >
                                {order.order_display_number || order.order_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} className="text-xs font-mono font-bold block">
                                Customer: {order.customer_name}
                              </span>
                              {order.payment_status === 'PAID' ? (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[0.6rem] font-mono font-bold uppercase border border-emerald-500/40">
                                  LUNAS
                                </span>
                              ) : order.payment_method === 'cashier' ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[0.6rem] font-mono font-bold uppercase border border-amber-500/40">
                                  BAYAR KASIR
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[0.6rem] font-mono font-bold uppercase border border-red-500/40">
                                  BELUM LUNAS
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[0.65rem] font-mono font-bold uppercase flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            SEDANG DIANTAR
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

                        {/* Complete Delivery Action */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <span style={{ color: isDark ? '#A89F91' : '#666666' }} className="text-[0.68rem] font-mono">
                            Total: {itemsList.length} Item
                          </span>
                          <button
                            onClick={() => handleCompleteServed(order.id, cleanTable)}
                            disabled={isLoading}
                            style={{
                              background: '#27AE60',
                              color: '#FFFFFF',
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:bg-[#2ECC71] active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>SUDAH DISAJIKAN DI MEJA</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: WAITER REQUESTS (Panggilan Meja - Phase 4 Active) */}
        {activeTab === 'REQUESTS' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 style={{ color: '#FFFFFF' }} className="text-sm font-serif font-bold">
                  Panggilan &amp; Permintaan Bantuan Meja ({activeRequests.length})
                </h2>
                <p style={{ color: isDark ? '#A89F91' : '#F3EFEA' }} className="text-[0.7rem] font-mono">
                  Daftar customer yang membutuhkan bantuan atau tagihan bill di meja.
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
                  Semua permintaan bantuan dan tagihan meja telah diselesaikan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((req) => {
                  const isLoading = actionLoadingId === req.id;
                  const isHandled = req.status === 'HANDLED';

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        border: isHandled ? '2px solid #27AE60' : '2px solid #F1C40F',
                        boxShadow: isDark ? '0 8px 25px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.1)',
                      }}
                      className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-serif font-black text-amber-400">
                            MEJA {req.table_code}
                          </span>
                          <span
                            style={{
                              background: req.request_type === 'BILL' ? 'rgba(230, 126, 34, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                              borderColor: req.request_type === 'BILL' ? '#E67E22' : '#F1C40F',
                              color: req.request_type === 'BILL' ? '#E67E22' : '#F1C40F',
                            }}
                            className="px-2.5 py-0.5 rounded-md border text-[0.68rem] font-mono font-bold uppercase"
                          >
                            {req.request_type === 'BILL' ? '🧾 MINTA BILL' : '🙋‍♂️ MINTA BANTUAN'}
                          </span>
                          <span
                            style={{
                              background: isHandled ? '#27AE60' : '#F1C40F',
                              color: isHandled ? '#FFFFFF' : '#070605',
                            }}
                            className="px-2 py-0.5 rounded-md text-[0.62rem] font-mono font-bold uppercase"
                          >
                            {isHandled ? 'SEDANG DITANGANI' : 'DALAM ANTREAN'}
                          </span>
                        </div>
                        <p style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="text-xs font-mono mb-1 font-medium">
                          {req.notes || 'Customer memanggil staf waiter ke meja.'}
                        </p>
                        <span style={{ color: isDark ? '#A89F91' : '#777777' }} className="text-[0.68rem] font-mono">
                          Waktu: {req.created_at ? new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                          {req.handled_by && ` • Oleh: ${req.handled_by}`}
                        </span>
                      </div>

                      {/* Request Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {!isHandled ? (
                          <button
                            onClick={() => handleStartHandlingRequest(req.id, req.table_code)}
                            disabled={isLoading}
                            style={{ background: '#F1C40F', color: '#070605' }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-[#F39C12] active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                            <span>TANGANI PANGGILAN</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCompleteRequest(req.id, req.table_code)}
                            disabled={isLoading}
                            style={{ background: '#27AE60', color: '#FFFFFF' }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-[#2ECC71] active:scale-95 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>TANDAI SELESAI</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

              {/* Active Requests on this table (Phase 4) */}
              {(() => {
                const tableReq = activeRequests.find((r) => isSameTable(r.table_code, selectedTable.code));
                if (tableReq) {
                  const isHandled = tableReq.status === 'HANDLED';
                  return (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[0.68rem] font-mono font-bold text-amber-400">
                          PANGGILAN AKTIF MEJA INI:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-black text-[0.62rem] font-mono font-bold">
                          {tableReq.request_type}
                        </span>
                      </div>
                      <p className="text-xs text-white mb-2.5 font-medium">
                        "{tableReq.notes}"
                      </p>
                      {!isHandled ? (
                        <button
                          onClick={() => handleStartHandlingRequest(tableReq.id, selectedTable.code)}
                          disabled={actionLoadingId === tableReq.id}
                          style={{ background: '#F1C40F', color: '#070605' }}
                          className="w-full py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          {actionLoadingId === tableReq.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                          <span>TANGANI PANGGILAN MEJA INI</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteRequest(tableReq.id, selectedTable.code)}
                          disabled={actionLoadingId === tableReq.id}
                          style={{ background: '#27AE60', color: '#FFFFFF' }}
                          className="w-full py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          {actionLoadingId === tableReq.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>SELESAI DITANGANI</span>
                        </button>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Active Orders on this table */}
              {(() => {
                const tableOrders = orders.filter((o) => isSameTable(o.table_id || o.table_code, selectedTable.code));
                const readyOrder = tableOrders.find((o) => o.order_status === 'READY');
                const deliveringOrder = tableOrders.find((o) => o.order_status === 'DELIVERING');

                if (readyOrder) {
                  return (
                    <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[0.68rem] font-mono font-bold text-orange-400 block">
                          PESANAN MEJA INI SIAP DIANTAR:
                        </span>
                        {readyOrder.payment_status === 'PAID' ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[0.6rem] font-mono font-bold uppercase border border-emerald-500/40">
                            LUNAS
                          </span>
                        ) : readyOrder.payment_method === 'cashier' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[0.6rem] font-mono font-bold uppercase border border-amber-500/40">
                            BAYAR KASIR
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[0.6rem] font-mono font-bold uppercase border border-red-500/40">
                            BELUM LUNAS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white mb-2">
                        {readyOrder.order_display_number || readyOrder.order_number} • {readyOrder.customer_name}
                      </p>
                      <button
                        onClick={() => handleStartDelivery(readyOrder.id, selectedTable.code)}
                        disabled={actionLoadingId === readyOrder.id}
                        style={{ background: '#9E1F1F', color: '#FFFFFF' }}
                        className="w-full py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        {actionLoadingId === readyOrder.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                        <span>AMBIL &amp; ANTAR PESANAN INI</span>
                      </button>
                    </div>
                  );
                }

                if (deliveringOrder) {
                  return (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[0.68rem] font-mono font-bold text-amber-400 block">
                          PESANAN SEDANG MENUJU MEJA INI:
                        </span>
                        {deliveringOrder.payment_status === 'PAID' ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[0.6rem] font-mono font-bold uppercase border border-emerald-500/40">
                            LUNAS
                          </span>
                        ) : deliveringOrder.payment_method === 'cashier' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[0.6rem] font-mono font-bold uppercase border border-amber-500/40">
                            BAYAR KASIR
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[0.6rem] font-mono font-bold uppercase border border-red-500/40">
                            BELUM LUNAS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white mb-2">
                        {deliveringOrder.order_display_number || deliveringOrder.order_number} • {deliveringOrder.customer_name}
                      </p>
                      <button
                        onClick={() => handleCompleteServed(deliveringOrder.id, selectedTable.code)}
                        disabled={actionLoadingId === deliveringOrder.id}
                        style={{ background: '#27AE60', color: '#FFFFFF' }}
                        className="w-full py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        {actionLoadingId === deliveringOrder.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>KONFIRMASI SUDAH DISAJIKAN</span>
                      </button>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Close CTA */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedTable(null)}
                  style={{
                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
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
