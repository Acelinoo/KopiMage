'use client';

import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Clock,
  CheckCircle2,
  Flame,
  RefreshCw,
  UtensilsCrossed,
  Loader2,
  BellRing,
  AlertTriangle,
  ChevronRight,
  Search,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  NEW_ORDER: { label: 'BARU MASUK', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/40' },
  PREPARING: { label: 'DIPROSES', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
  READY: { label: 'SIAP ANTAR', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40' },
};

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [searchTable, setSearchTable] = useState('');

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            item_name,
            quantity,
            notes,
            order_item_modifiers (
              modifier_name,
              option_label
            )
          ),
          tables (
            code,
            name
          )
        `)
        .in('order_status', ['NEW_ORDER', 'PREPARING', 'READY'])
        .order('created_at', { ascending: true });

      if (!error && data) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const supabase = createClient();
    const channel = supabase
      .channel('kds_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchKitchenOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'COMPLETED') => {
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ order_status: nextStatus }).eq('id', orderId);
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
          .filter((o) => o.order_status !== 'COMPLETED')
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getElapsedSeconds = (createdAt: string) => {
    return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000);
  };

  const formatElapsed = (createdAt: string) => {
    const diff = getElapsedSeconds(createdAt);
    if (diff < 60) return `${diff}d`;
    return `${Math.floor(diff / 60)}m ${diff % 60}d`;
  };

  const getTimerBadgeStyle = (createdAt: string) => {
    const seconds = getElapsedSeconds(createdAt);
    if (seconds > 900) {
      // Over 15 min - Urgent Alert
      return 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse font-bold';
    } else if (seconds > 300) {
      // Over 5 min
      return 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-semibold';
    }
    return 'bg-[#0E0B0A] border-[#FFFFFF]/10 text-[#A89F91]';
  };

  const filteredOrders = orders.filter(o => {
    const tableCode = o.tables?.code || o.table_number || '';
    const tableName = o.tables?.name || '';
    const query = searchTable.toLowerCase();
    return tableCode.toLowerCase().includes(query) || tableName.toLowerCase().includes(query);
  });

  const newCount = orders.filter((o) => o.order_status === 'NEW_ORDER').length;
  const preparingCount = orders.filter((o) => o.order_status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.order_status === 'READY').length;

  return (
    <main className="min-h-screen bg-[#0E0B0A] text-[#FFFFFF] font-sans pb-12 selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      {/* KDS Header */}
      <header className="sticky top-0 z-50 bg-[#161210]/95 backdrop-blur-md border-b border-[#FFFFFF]/10 px-4 sm:px-8 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B82E2E] flex items-center justify-center shrink-0 shadow-lg shadow-[#B82E2E]/20">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#B82E2E]">LIVE KITCHEN DISPLAY</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-light text-white leading-tight">Dapur &amp; Barista Monitor</h1>
            </div>
          </div>

          {/* Real-time Order Counters & Time */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>BARU: {newCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>PROSES: {preparingCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SIAP: {readyCount}</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-[#C29B7F] font-mono tabular-nums font-semibold">
              <Clock className="w-4 h-4 text-[#B82E2E]" />
              <span>{now.toLocaleTimeString('id-ID')} WIB</span>
            </div>

            <button
              onClick={fetchKitchenOrders}
              className="p-2.5 rounded-xl border border-[#FFFFFF]/15 bg-[#0E0B0A] text-[#A89F91] hover:text-white hover:border-[#B82E2E] transition-all cursor-pointer shadow-sm"
              title="Refresh Antrian Dapur"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Orders Container */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 pt-8">
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-serif text-white font-light">Antrean Meja Aktif ({orders.length})</h2>
            <p className="text-xs text-[#A89F91]">Pesanan urut berdasarkan waktu masuk tercepat di bar &amp; dapur.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari Meja 07, Teras..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-32 text-[#A89F91]">
            <Loader2 className="w-6 h-6 animate-spin text-[#B82E2E]" />
            <span className="text-sm">Memuat antrean dapur...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#161210] border border-emerald-500/30 text-center max-w-md mx-auto my-16 shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">Semua Pesanan Selesai!</h3>
            <p className="text-xs text-[#A89F91]">Tidak ada pesanan pending di dapur saat ini. Standby untuk order baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredOrders.map((o) => {
                const config = STATUS_CONFIG[o.order_status] || STATUS_CONFIG.NEW_ORDER;
                const tableCode = o.tables?.code || o.table_number || '00';
                const tableName = o.tables?.name || `MEJA ${tableCode}`;

                return (
                  <motion.div
                    key={o.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-3xl bg-[#161210] border ${config.border} p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden`}
                  >
                    <div>
                      {/* Card Header: Table Number & Status Pill */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#FFFFFF]/10 gap-2">
                        <div>
                          <span className="text-[0.62rem] tracking-widest uppercase font-semibold text-[#A89F91] block">NOMOR MEJA</span>
                          <div className="font-serif text-2xl font-bold text-white flex items-center gap-2">
                            <span>{tableName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`px-3 py-1 rounded-full border text-[0.65rem] font-sans tracking-widest uppercase font-bold ${config.bg} ${config.text} ${config.border}`}>
                            {config.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg border text-[0.68rem] font-mono tabular-nums flex items-center gap-1 ${getTimerBadgeStyle(o.created_at)}`}>
                            <Clock className="w-3 h-3" />
                            {formatElapsed(o.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items List */}
                      <div className="space-y-3 mb-6">
                        {o.order_items?.map((item: any) => (
                          <div key={item.id} className="p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/08">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-sans text-sm font-semibold text-white leading-snug">
                                {item.item_name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-[#B82E2E] text-white text-xs font-bold shrink-0">
                                x{item.quantity}
                              </span>
                            </div>

                            {/* Modifiers List (Hot/Ice, Literan) */}
                            {item.order_item_modifiers?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.order_item_modifiers.map((mod: any, idx: number) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-[#C29B7F]/15 text-[#C29B7F] text-[0.65rem] font-sans">
                                    {mod.option_label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Special Customer Notes */}
                            {item.notes && (
                              <div className="mt-2 text-[0.72rem] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg italic">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Advancement Button */}
                    <div className="pt-3 border-t border-[#FFFFFF]/10">
                      {o.order_status === 'NEW_ORDER' && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'PREPARING')}
                          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-white" />
                          <span>MULAI DIPROSES DAPUR</span>
                        </button>
                      )}

                      {o.order_status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'READY')}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <BellRing className="w-4 h-4 text-white animate-bounce" />
                          <span>PESANAN SIAP DIANTAR</span>
                        </button>
                      )}

                      {o.order_status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}
                          className="w-full py-3 rounded-xl bg-[#0E0B0A] hover:bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>SELESAI (DISAJIKAN)</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
