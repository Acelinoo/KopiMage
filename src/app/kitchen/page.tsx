'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import {
  Coffee,
  Clock,
  CheckCircle2,
  Flame,
  RefreshCw,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Play clean synthetic Web Audio chime for new kitchen orders (No external asset files needed)
const playNewOrderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio chime playback error:', e);
  }
};

import { createClient } from '@/lib/supabase/client';

export default function KitchenDisplayPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'RECONNECTING'>('LIVE');
  const [now, setNow] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState<'ALL' | 'BARISTA' | 'KITCHEN'>('ALL');
  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderCountRef = useRef<number>(0);
  const recentLocalUpdatesRef = useRef<Record<string, { status: string; timestamp: number }>>({});

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Order Fetcher from Live API (With zero-data-loss LocalStorage cache fallback)
  const fetchKitchenOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders?status=ALL');
      const data = await res.json();
      let apiOrders = (data.success && Array.isArray(data.orders)) ? data.orders : [];

      // Merge with LocalStorage Admin & Active Order Caches to guarantee ZERO data loss across lambda instances
      if (typeof window !== 'undefined') {
        try {
          const adminCache = localStorage.getItem('kopimage_admin_orders_cache_v4');
          const activeOrderCache = localStorage.getItem('kopimage_active_table_order');
          const localList: any[] = [];
          if (adminCache) localList.push(...JSON.parse(adminCache));
          if (activeOrderCache) localList.push(JSON.parse(activeOrderCache));

          const apiMap = new Map(apiOrders.map((o: any) => [o.id, o]));
          localList.forEach((loc) => {
            if (!loc || !loc.id) return;
            const existing = apiMap.get(loc.id);
            if (!existing) {
              apiOrders.push(loc);
            } else {
              // Prefer record with updated payment_status / order_status
              if (loc.payment_status === 'PAID' && (existing as any)?.payment_status !== 'PAID') {
                apiMap.set(loc.id, { ...(existing as any), ...loc });
              }
            }
          });
          apiOrders = Array.from(apiMap.values());
        } catch (e) {}
      }

      // Merge recent local optimistic status overrides to prevent poll reverting
      const fetchedOrders = apiOrders.map((o: any) => {
        const localOverride = recentLocalUpdatesRef.current[o.id];
        if (localOverride && Date.now() - localOverride.timestamp < 15000) {
          return { ...o, order_status: localOverride.status };
        }
        return o;
      });

      // Clean expired overrides (> 15 seconds)
      Object.keys(recentLocalUpdatesRef.current).forEach((id) => {
        if (Date.now() - recentLocalUpdatesRef.current[id].timestamp >= 15000) {
          delete recentLocalUpdatesRef.current[id];
        }
      });
      
      // Play sound chime if new uncompleted order count increased
      const activeCount = fetchedOrders.filter((o: any) => o.order_status !== 'COMPLETED').length;
      if (activeCount > previousOrderCountRef.current && previousOrderCountRef.current !== 0 && soundEnabled) {
        playNewOrderChime();
      }
      previousOrderCountRef.current = activeCount;

      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders(true);

    // 1. Supabase Realtime WebSocket listener for instant zero-delay order dispatch
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('kds-realtime-orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          if (soundEnabled) playNewOrderChime();
          fetchKitchenOrders(false);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
          fetchKitchenOrders(false);
        })
        .subscribe((status) => {
          setConnectionStatus(status === 'SUBSCRIBED' ? 'LIVE' : 'RECONNECTING');
        });
    } catch (err) {
      console.warn('Realtime subscription fallback to polling:', err);
    }

    // 2. Fallback Heartbeat Polling (every 15 seconds) for offline/reconnect recovery
    const interval = setInterval(() => fetchKitchenOrders(false), 15000);

    return () => {
      clearInterval(interval);
      if (channel) channel.unsubscribe();
    };
  }, [soundEnabled]);

  // Update order kitchen status handler
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'COMPLETED') => {
    try {
      // 1. Store local optimistic status override for 15s to block polling flip-flops
      recentLocalUpdatesRef.current[orderId] = {
        status: nextStatus,
        timestamp: Date.now(),
      };

      // 2. Optimistic UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
      );

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memperbarui status');
      }

      // Re-fetch after 1 sec delay to let DB settle
      setTimeout(() => fetchKitchenOrders(false), 1000);
    } catch (err) {
      console.error('Failed to update kitchen order status:', err);
      delete recentLocalUpdatesRef.current[orderId];
      fetchKitchenOrders(false);
    }
  };

  // Helper: Elapsed minutes calculation
  const getElapsedMinutes = (createdAt: string) => {
    if (!createdAt) return 0;
    const diffMs = now.getTime() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Helper: Determine station category for item
  const getItemStation = (itemName: string) => {
    const lower = (itemName || '').toLowerCase();
    if (lower.includes('kopi') || lower.includes('espresso') || lower.includes('latte') || lower.includes('tea') || lower.includes('matcha') || lower.includes('es') || lower.includes('ice') || lower.includes('minum')) {
      return 'BARISTA';
    }
    return 'KITCHEN';
  };

  // Filter orders by search, approval status, & tabs
  const filteredOrders = orders.filter((o) => {
    // ALL orders show up in kitchen instantly so Barista & Dapur can prepare coffee & food without delay
    const isApprovedForKitchen = true;
    if (!isApprovedForKitchen) return false;

    const isCompleted = o.order_status === 'COMPLETED';
    if (statusTab === 'ACTIVE' && isCompleted) return false;
    if (statusTab === 'COMPLETED' && !isCompleted) return false;

    // Search Filter
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.table_id || o.tables?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Station Filter
    if (stationFilter !== 'ALL') {
      const itemsList = o.order_items || o.items || [];
      if (itemsList.length > 0) {
        const hasStationItem = itemsList.some(
          (item: any) => getItemStation(item.item_name) === stationFilter
        );
        if (!hasStationItem) return false;
      }
    }

    return true;
  });

  const activeOrdersCount = orders.filter((o) => o.order_status !== 'COMPLETED').length;
  const preparingCount = orders.filter((o) => o.order_status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.order_status === 'READY').length;

  return (
    <div
      style={{
        background: isDark ? '#0E0B0A' : '#9E1F1F',
        color: isDark ? '#F7F4EF' : '#FFFFFF',
        minHeight: '100vh',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
      className="p-4 md:p-8 selection:bg-[#B82E2E] selection:text-white"
    >
      {/* Top Bar Navigation */}
      <header
        style={{
          background: isDark ? '#161210' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
          borderRadius: '24px',
          boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 30px rgba(0, 0, 0, 0.12)',
        }}
        className="max-w-7xl mx-auto mb-8 p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div
            style={{ background: '#9E1F1F' }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
          >
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                className="text-[0.68rem] font-mono uppercase tracking-widest font-bold"
              >
                KOPIMAGE KITCHEN SYSTEM
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <h1
              style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
              className="text-xl md:text-2xl font-black font-serif tracking-tight"
            >
              Kitchen & Barista Display (KDS)
            </h1>
          </div>
        </div>

        {/* Stats Pills & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Connection Status Indicator */}
          <div
            style={{
              background: isDark ? '#0E0B0A' : '#FAF7F5',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
          >
            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className={connectionStatus === 'LIVE' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
              {connectionStatus === 'LIVE' ? 'LIVE' : 'RECONNECTING'}
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: soundEnabled
                ? (isDark ? 'rgba(39, 174, 96, 0.15)' : '#F2FAF5')
                : (isDark ? 'rgba(231, 76, 60, 0.15)' : '#FDEDEC'),
              borderColor: soundEnabled ? '#27AE60' : '#E74C3C',
              color: soundEnabled ? '#27AE60' : '#E74C3C',
            }}
            className="p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 font-bold"
            title={soundEnabled ? 'Suara Alert Aktif' : 'Suara Alert Mati'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
          </button>

          {/* Stat: Aktif */}
          <div
            style={{
              background: isDark ? '#0E0B0A' : '#FAF7F5',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
          >
            <span style={{ color: isDark ? '#A89F91' : '#555555' }}>Aktif:</span>
            <span style={{ background: '#9E1F1F', color: '#FFFFFF' }} className="font-bold px-2 py-0.5 rounded-md">
              {activeOrdersCount}
            </span>
          </div>

          {/* Stat: Disiapkan */}
          <div
            style={{
              background: isDark ? '#0E0B0A' : '#FAF7F5',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
          >
            <span style={{ color: isDark ? '#A89F91' : '#555555' }}>Disiapkan:</span>
            <span style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} className="font-bold">
              {preparingCount}
            </span>
          </div>

          {/* Stat: Siap Antar */}
          <div
            style={{
              background: isDark ? '#0E0B0A' : '#FAF7F5',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
          >
            <span style={{ color: isDark ? '#A89F91' : '#555555' }}>Siap Antar:</span>
            <span className="font-bold text-emerald-500">
              {readyCount}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchKitchenOrders(false)}
            disabled={isRefreshing}
            style={{
              background: isDark ? '#0E0B0A' : '#FAF7F5',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
              color: isDark ? '#FFFFFF' : '#9E1F1F',
            }}
            className="p-2.5 rounded-xl border hover:opacity-80 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Tiket Pesanan"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9E1F1F]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filter & Station Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs (Pesanan Aktif vs Selesai) */}
        <div
          style={{
            background: isDark ? '#161210' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl shadow-sm"
        >
          <button
            onClick={() => setStatusTab('ACTIVE')}
            style={{
              background: statusTab === 'ACTIVE' ? (isDark ? '#B82E2E' : '#9E1F1F') : 'transparent',
              color: statusTab === 'ACTIVE' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
          >
            TIKET AKTIF ({activeOrdersCount})
          </button>
          <button
            onClick={() => setStatusTab('COMPLETED')}
            style={{
              background: statusTab === 'COMPLETED' ? (isDark ? '#B82E2E' : '#9E1F1F') : 'transparent',
              color: statusTab === 'COMPLETED' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
          >
            SELESAI DISAJIKAN
          </button>
        </div>

        {/* Station Filter (Semua, Barista, Dapur) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{ color: isDark ? '#A89F91' : '#FFFFFF' }}
            className="text-[0.7rem] font-mono font-bold uppercase tracking-wider"
          >
            STASIUN:
          </span>
          {[
            { id: 'ALL', label: 'Semua Tiket', icon: UtensilsCrossed },
            { id: 'BARISTA', label: 'Barista (Minuman)', icon: Coffee },
            { id: 'KITCHEN', label: 'Dapur (Makanan)', icon: Flame },
          ].map((st) => {
            const isActive = stationFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id as any)}
                style={{
                  background: isActive
                    ? (isDark ? '#B82E2E' : '#FFFFFF')
                    : (isDark ? '#161210' : 'rgba(255, 255, 255, 0.15)'),
                  border: isActive
                    ? (isDark ? '1px solid #B82E2E' : '2px solid #FFFFFF')
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.35)'),
                  color: isActive
                    ? (isDark ? '#FFFFFF' : '#9E1F1F')
                    : (isDark ? '#A89F91' : '#FFFFFF'),
                  fontWeight: isActive ? 800 : 600,
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <st.icon className="w-3.5 h-3.5" />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Ticket Grid */}
      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-white animate-spin mb-3" />
            <p style={{ color: isDark ? '#A89F91' : '#FFFFFF' }} className="text-sm font-mono font-bold">
              Menghubungkan ke Stasiun Dapur KOPIMAGE...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              background: isDark ? 'rgba(22, 18, 16, 0.5)' : '#FFFFFF',
              border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1.5px dashed #9E1F1F',
            }}
            className="py-24 text-center rounded-3xl p-6 shadow-sm"
          >
            <UtensilsCrossed
              style={{ color: isDark ? '#A89F91' : '#9E1F1F' }}
              className="w-12 h-12 mx-auto mb-3 opacity-60"
            />
            <h3
              style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
              className="text-lg font-serif font-bold mb-1"
            >
              {statusTab === 'ACTIVE' ? 'Tidak Ada Tiket Pesanan Aktif Saat Ini' : 'Belum Ada Riwayat Tiket Selesai'}
            </h3>
            <p
              style={{ color: isDark ? '#A89F91' : '#555555' }}
              className="text-xs font-mono"
            >
              {statusTab === 'ACTIVE'
                ? 'Semua pesanan telah selesai disajikan atau belum ada pesanan baru.'
                : 'Tiket pesanan yang selesai disajikan akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const elapsedMin = getElapsedMinutes(order.created_at);
                const isUrgent = elapsedMin >= 12;
                const isWarning = elapsedMin >= 6 && elapsedMin < 12;

                const currentStatus = order.order_status || 'NEW_ORDER';
                const cleanTableCode =
                  order.table_code ||
                  (order.tables?.code && !order.tables.code.includes('-') ? order.tables.code : null) ||
                  (order.table_id && !String(order.table_id).includes('-') ? order.table_id : '01');

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      background: isDark
                        ? (isUrgent ? '#140807' : currentStatus === 'READY' ? '#06120B' : '#161210')
                        : '#FFFFFF',
                      border: isUrgent
                        ? '2px solid #E74C3C'
                        : currentStatus === 'READY'
                        ? '2px solid #27AE60'
                        : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #9E1F1F'),
                      boxShadow: isDark
                        ? '0 10px 30px rgba(0, 0, 0, 0.6)'
                        : '0 10px 30px rgba(0, 0, 0, 0.15)',
                    }}
                    className="rounded-3xl p-5 flex flex-col justify-between transition-all relative overflow-hidden"
                  >
                    {/* Header Top Badge & Timer */}
                    <div>
                      <div
                        style={{
                          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                        }}
                        className="flex items-center justify-between gap-2 pb-3 mb-4"
                      >
                        <div>
                          <span
                            style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                            className="text-[0.72rem] font-mono font-bold block tracking-wider"
                          >
                            {order.order_display_number || `#${order.order_number}`}
                          </span>
                          <h2
                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                            className="text-lg font-black font-serif flex items-center gap-2"
                          >
                            <span>MEJA {cleanTableCode}</span>
                            <span
                              style={{ color: isDark ? '#D4A373' : '#777777' }}
                              className="text-xs font-normal font-mono"
                            >
                              ({order.mode === 'takeaway' ? 'TAKEAWAY' : 'DINE-IN'})
                            </span>
                          </h2>
                        </div>

                        {/* Elapsed Timer Badge (No AI slop) */}
                        <div
                          style={
                            isUrgent
                              ? { background: '#E74C3C', color: '#FFFFFF', border: '1px solid #C0392B' }
                              : isWarning
                              ? {
                                  background: isDark ? 'rgba(230, 126, 34, 0.15)' : '#FFF9F4',
                                  color: '#E67E22',
                                  border: '1px solid #E67E22',
                                }
                              : {
                                  background: isDark ? 'rgba(39, 174, 96, 0.15)' : '#F2FAF5',
                                  color: '#27AE60',
                                  border: '1px solid #27AE60',
                                }
                          }
                          className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMin} mnt</span>
                        </div>
                      </div>

                      {/* Customer Name & Notes */}
                      <div className="mb-4">
                        <span
                          style={{ color: isDark ? '#A89F91' : '#555555' }}
                          className="text-[0.75rem] block font-mono"
                        >
                          Pemesan:{' '}
                          <strong
                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                            className="font-serif font-bold"
                          >
                            {order.customer_name || 'Pelanggan'}
                          </strong>{' '}
                          ({order.customer_phone || '-'})
                        </span>
                        {currentStatus === 'CANCELLATION_REQUESTED' && (
                          <div
                            style={{
                              background: isDark ? 'rgba(230, 126, 34, 0.15)' : '#FFF9F4',
                              borderColor: '#E67E22',
                              color: '#E67E22',
                            }}
                            className="mt-2 p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse"
                          >
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>CUSTOMER MENGAJUKAN PEMBATALAN</span>
                          </div>
                        )}
                      </div>

                      {/* Items Checklist */}
                      <div className="space-y-3 mb-6">
                        <span
                          style={{ color: isDark ? '#A89F91' : '#555555' }}
                          className="text-[0.68rem] font-mono uppercase tracking-wider block mb-1 font-bold"
                        >
                          ITEM PESANAN DIBUAT:
                        </span>
                        {(order.order_items || order.items || []).map((item: any, idx: number) => {
                          const station = getItemStation(item.item_name);
                          return (
                            <div
                              key={item.id || idx}
                              style={{
                                background: isDark ? '#0E0B0A' : '#FAF7F5',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(158, 31, 31, 0.25)',
                              }}
                              className="p-3 rounded-2xl flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  style={{
                                    background: isDark ? 'rgba(184, 46, 46, 0.2)' : '#F5EBEB',
                                    color: isDark ? '#D4A373' : '#9E1F1F',
                                  }}
                                  className="w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5"
                                >
                                  {item.quantity}x
                                </span>
                                <div>
                                  <h4
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="text-sm font-bold leading-tight"
                                  >
                                    {item.item_name}
                                  </h4>

                                  {/* Modifiers / Options */}
                                  {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                                    <div
                                      style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                      className="text-[0.7rem] font-mono mt-0.5 font-semibold"
                                    >
                                      {item.order_item_modifiers.map((m: any) => `${m.modifier_name}: ${m.option_label}`).join(', ')}
                                    </div>
                                  )}

                                  {/* Item Special Catatan */}
                                  {item.notes && (
                                    <div
                                      style={{
                                        background: isDark ? 'rgba(230, 126, 34, 0.1)' : '#FFF9F4',
                                        borderColor: 'rgba(230, 126, 34, 0.3)',
                                        color: isDark ? '#F39C12' : '#C0392B',
                                      }}
                                      className="mt-1 px-2 py-0.5 rounded border text-[0.68rem] font-mono"
                                    >
                                      Catatan: "{item.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Station Badge (Under + Top Line, No Pill Slop) */}
                              <span
                                style={{
                                  borderTop: '1px solid currentColor',
                                  borderBottom: '1px solid currentColor',
                                  color: isDark ? '#D4A373' : '#9E1F1F',
                                }}
                                className="px-1.5 py-0.5 text-[0.62rem] font-mono font-bold uppercase tracking-wider whitespace-nowrap"
                              >
                                {station === 'BARISTA' ? 'BARISTA' : 'DAPUR'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Controls — 1-TAP BUMP SYSTEM */}
                    <div
                      style={{
                        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                      }}
                      className="pt-3 space-y-2"
                    >
                      {currentStatus !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                          style={{
                            background: '#27AE60',
                            color: '#FFFFFF',
                            borderRadius: '14px',
                          }}
                          className="w-full p-3.5 hover:opacity-90 font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>SELESAI DISAJIKAN (1-TAP)</span>
                        </button>
                      ) : (
                        <div
                          style={{
                            background: isDark ? 'rgba(39, 174, 96, 0.15)' : '#F2FAF5',
                            borderColor: 'rgba(39, 174, 96, 0.3)',
                            color: '#27AE60',
                          }}
                          className="text-center py-2.5 border rounded-2xl text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PESANAN SUDAH DISAJIKAN 100%</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
