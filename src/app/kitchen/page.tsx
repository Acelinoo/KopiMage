'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Coffee,
  Clock,
  CheckCircle2,
  Flame,
  RefreshCw,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  CheckSquare
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

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Real-time Order Fetcher from Live API
  const fetchKitchenOrders = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders?status=ALL');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        // Merge recent local optimistic status overrides to prevent poll reverting
        const fetchedOrders = data.orders.map((o: any) => {
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
      }
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders(true);
    const interval = setInterval(() => fetchKitchenOrders(false), 5000);
    return () => clearInterval(interval);
  }, []);

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
    // KITCHEN APPROVAL POLICY:
    // QRIS/Transfer orders only appear in kitchen after Admin approves payment (PAID).
    // Cashier orders appear in kitchen immediately (cashier).
    const isApprovedForKitchen = o.payment_method === 'cashier' || o.payment_status === 'PAID';
    if (!isApprovedForKitchen) return false;

    const isCompleted = o.order_status === 'COMPLETED';
    if (statusTab === 'ACTIVE' && isCompleted) return false;
    if (statusTab === 'COMPLETED' && !isCompleted) return false;

    // Search Filter
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tables?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Station Filter
    if (stationFilter !== 'ALL') {
      const itemsList = o.order_items || o.items || [];
      const hasStationItem = itemsList.some(
        (item: any) => getItemStation(item.item_name) === stationFilter
      );
      if (!hasStationItem) return false;
    }

    return true;
  });

  const activeOrdersCount = orders.filter((o) => (o.payment_method === 'cashier' || o.payment_status === 'PAID') && o.order_status !== 'COMPLETED').length;
  const preparingCount = orders.filter((o) => (o.payment_method === 'cashier' || o.payment_status === 'PAID') && o.order_status === 'PREPARING').length;
  const readyCount = orders.filter((o) => (o.payment_method === 'cashier' || o.payment_status === 'PAID') && o.order_status === 'READY').length;

  return (
    <div className="min-h-screen bg-[#070605] text-[#F7F4EF] font-sans p-4 md:p-8 selection:bg-[#B82E2E] selection:text-white">
      {/* Top Bar Navigation */}
      <header className="max-w-7xl mx-auto mb-8 bg-[#0E0C0A] border border-[#FFFFFF]/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B82E2E] to-[#6E1A1A] flex items-center justify-center shadow-lg shadow-[#B82E2E]/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-mono uppercase tracking-widest text-[#B82E2E] font-bold">KOPIMAGE KITCHEN SYSTEM</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <h1 className="text-xl md:text-2xl font-black font-serif tracking-tight text-white">
              Kitchen & Barista Display (KDS)
            </h1>
          </div>
        </div>

        {/* Stats Pills & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs font-mono">
            <span className="text-[#A89F91]">Aktif:</span>
            <span className="font-bold text-white bg-[#B82E2E] px-2 py-0.5 rounded-md">{activeOrdersCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs font-mono">
            <span className="text-[#A89F91]">Disiapkan:</span>
            <span className="font-bold text-[#C29B7F]">{preparingCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs font-mono">
            <span className="text-[#A89F91]">Siap Antar:</span>
            <span className="font-bold text-emerald-400">{readyCount}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-[#B82E2E]/20 border-[#B82E2E] text-white hover:bg-[#B82E2E]/30'
                : 'bg-[#161210] border-[#FFFFFF]/10 text-[#A89F91] hover:text-white'
            }`}
            title={soundEnabled ? 'Suara Alert Aktif' : 'Suara Alert Di-Mute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#B82E2E]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => fetchKitchenOrders(false)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 hover:border-[#B82E2E] text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Tiket Pesanan"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#B82E2E]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filter & Station Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs (Pesanan Aktif vs Selesai) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0E0C0A] border border-[#FFFFFF]/10">
          <button
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              statusTab === 'ACTIVE'
                ? 'bg-[#B82E2E] text-white shadow-md shadow-[#B82E2E]/20'
                : 'text-[#A89F91] hover:text-white'
            }`}
          >
            🔥 TIKET AKTIF DOK ({activeOrdersCount})
          </button>
          <button
            onClick={() => setStatusTab('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              statusTab === 'COMPLETED'
                ? 'bg-[#B82E2E] text-white shadow-md shadow-[#B82E2E]/20'
                : 'text-[#A89F91] hover:text-white'
            }`}
          >
            ✅ SELESAI DISAJIKAN
            SELESAI DISAJIKAN
          </button>
        </div>

        {/* Station Filter (Semua, Barista, Dapur) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.65rem] font-mono text-[#A89F91] uppercase">Stasiun:</span>
          {[
            { id: 'ALL', label: 'Semua Tiket', icon: UtensilsCrossed },
            { id: 'BARISTA', label: 'Barista (Kopi/Minuman)', icon: Coffee },
            { id: 'KITCHEN', label: 'Dapur Utama (Makanan)', icon: Flame },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStationFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                stationFilter === st.id
                  ? 'bg-[#C29B7F]/20 border-[#C29B7F] text-white'
                  : 'bg-[#0E0C0A] border-[#FFFFFF]/10 text-[#A89F91] hover:border-[#C29B7F]'
              }`}
            >
              <st.icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Ticket Grid */}
      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-[#B82E2E] animate-spin mb-3" />
            <p className="text-sm font-mono text-[#A89F91]">Menghubungkan ke Stasiun Dapur KOPIMAGE...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[#FFFFFF]/10 rounded-3xl bg-[#0E0C0A]/50">
            <UtensilsCrossed className="w-12 h-12 text-[#A89F91]/40 mx-auto mb-3" />
            <h3 className="text-base font-serif text-white font-bold mb-1">
              {statusTab === 'ACTIVE' ? 'Tidak Ada Tiket Pesanan Aktif Saat Ini' : 'Belum Ada Riwayat Tiket Selesai'}
            </h3>
            <p className="text-xs text-[#A89F91] font-mono">
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
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition-all shadow-xl relative overflow-hidden ${
                      isUrgent
                        ? 'bg-[#140807] border-[#B82E2E] shadow-[#B82E2E]/20 ring-1 ring-[#B82E2E]/40'
                        : currentStatus === 'READY'
                        ? 'bg-[#06120B] border-emerald-500/50 shadow-emerald-500/10'
                        : currentStatus === 'PREPARING'
                        ? 'bg-[#120E09] border-[#C29B7F]/50 shadow-[#C29B7F]/10'
                        : 'bg-[#0E0C0A] border-[#FFFFFF]/10'
                    }`}
                  >
                    {/* Header Top Badge & Timer */}
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-[#FFFFFF]/10 pb-3 mb-4">
                        <div>
                          <span className="text-[0.65rem] font-mono text-[#A89F91] block">
                            TIKET #{order.order_number}
                          </span>
                          <h2 className="text-lg font-black font-serif text-white flex items-center gap-2">
                            <span>MEJA {cleanTableCode}</span>
                            <span className="text-xs font-normal text-[#C29B7F] font-mono">
                              ({order.mode === 'takeaway' ? 'TAKEAWAY' : 'DINE-IN'})
                            </span>
                          </h2>
                        </div>

                        {/* Elapsed Timer Badge */}
                        <div
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
                            isUrgent
                              ? 'bg-[#B82E2E] text-white border-red-400 animate-pulse'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMin} mnt</span>
                        </div>
                      </div>

                      {/* Customer Name & Notes */}
                      <div className="mb-4">
                        <span className="text-[0.7rem] text-[#A89F91] block font-mono">
                          Pemesan: <strong className="text-white font-serif">{order.customer_name || 'Pelanggan'}</strong> ({order.customer_phone || '-'})
                        </span>
                      </div>

                      {/* Items Checklist */}
                      <div className="space-y-3 mb-6">
                        <span className="text-[0.65rem] font-mono uppercase text-[#A89F91] tracking-wider block mb-1">
                          ITEM PESANAN DIBUAT:
                        </span>
                        {(order.order_items || order.items || []).map((item: any, idx: number) => {
                          const station = getItemStation(item.item_name);
                          return (
                            <div
                              key={item.id || idx}
                              className="p-3 rounded-2xl bg-[#161210] border border-[#FFFFFF]/5 flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-[#B82E2E]/20 text-[#B82E2E] font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-white leading-tight">
                                    {item.item_name}
                                  </h4>

                                  {/* Modifiers / Temperature */}
                                  {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                                    <div className="text-[0.7rem] text-[#C29B7F] font-mono mt-0.5">
                                      {item.order_item_modifiers.map((m: any) => `${m.modifier_name}: ${m.option_label}`).join(', ')}
                                    </div>
                                  )}

                                  {/* Item Special Catatan */}
                                  {item.notes && (
                                    <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[0.65rem] font-mono text-amber-300">
                                      Catatan: "{item.notes}"
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Station Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[0.6rem] font-mono font-semibold uppercase ${
                                  station === 'BARISTA'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'bg-[#B82E2E]/15 text-[#B82E2E] border border-[#B82E2E]/20'
                                }`}
                              >
                                {station === 'BARISTA' ? '☕ Bar' : '🍝 Dapur'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="pt-3 border-t border-[#FFFFFF]/10 space-y-2">
                      {currentStatus === 'NEW_ORDER' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                          className="w-full p-3 rounded-2xl bg-[#C29B7F] hover:bg-[#D4A373] text-[#070605] font-mono text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Flame className="w-4 h-4" />
                          <span>MULAI PREPARASI / BREWING</span>
                        </button>
                      )}

                      {currentStatus === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                          className="w-full p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>TANDAI SIAP DISAJIKAN</span>
                        </button>
                      )}

                      {currentStatus === 'READY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                          className="w-full p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span>SELESAI / DISAJIKAN KE MEJA</span>
                        </button>
                      )}

                      {currentStatus === 'COMPLETED' && (
                        <div className="text-center py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
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
