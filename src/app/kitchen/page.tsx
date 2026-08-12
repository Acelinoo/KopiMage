'use client';

import React, { useState, useEffect } from 'react';
import { Coffee, Clock, CheckCircle, Flame, RefreshCw, UtensilsCrossed, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  NEW_ORDER: { label: 'BARU MASUK', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/40' },
  PREPARING: { label: 'DIPROSES', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
  READY: { label: 'SIAP ANTAR', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40' },
};

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

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

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000);
    if (diff < 60) return `${diff}d`;
    return `${Math.floor(diff / 60)}m ${diff % 60}d`;
  };

  const newCount = orders.filter((o) => o.order_status === 'NEW_ORDER').length;
  const preparingCount = orders.filter((o) => o.order_status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.order_status === 'READY').length;

  return (
    <main className="min-h-screen bg-[#0A0807] text-[#F7F4EF] font-sans">
      {/* KDS Header */}
      <header className="sticky top-0 z-50 bg-[#0E0B0A]/95 backdrop-blur-md border-b border-[#FFFFFF]/08 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#B82E2E] flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">Kitchen & Barista Display</h1>
              <span className="text-xs text-[#C29B7F] font-medium tracking-wide">KOPIMAGE • KDS Real-time</span>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              BARU: {newCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5" />
              PROSES: {preparingCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              SIAP: {readyCount}
            </div>

            <div className="ml-2 text-xs text-[#A89F91] font-mono tabular-nums hidden sm:block">
              {now.toLocaleTimeString('id-ID')}
            </div>

            <button
              onClick={fetchKitchenOrders}
              className="ml-1 p-2 rounded-lg border border-[#FFFFFF]/10 bg-[#161210] text-[#A89F91] hover:text-white hover:border-[#C29B7F] transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="max-w-screen-2xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-32 text-[#A89F91]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Memuat antrian dapur...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Semua Pesanan Selesai!</h3>
            <p className="text-sm text-[#A89F91]">Tidak ada antrian pesanan aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.order_status] || STATUS_CONFIG['NEW_ORDER'];
              const isNew = order.order_status === 'NEW_ORDER';

              return (
                <div
                  key={order.id}
                  className={`flex flex-col rounded-2xl border bg-[#121010] overflow-hidden transition-all ${isNew
                    ? 'border-red-500/60 shadow-lg shadow-red-900/20'
                    : 'border-[#FFFFFF]/10'
                    }`}
                >
                  {/* Card Header */}
                  <div className={`px-5 py-4 border-b ${isNew ? 'border-red-500/20 bg-red-500/05' : 'border-[#FFFFFF]/08 bg-[#161210]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs text-[#A89F91] uppercase tracking-widest font-medium">No. Pesanan</span>
                        <h2 className="text-xl font-black text-white tracking-tight mt-0.5">{order.order_number}</h2>
                        <p className="text-sm font-semibold text-[#C29B7F] mt-0.5">
                          {order.mode === 'dine-in'
                            ? `Meja ${order.tables?.code || order.table_id || '-'}`
                            : 'TAKEAWAY'}
                          {order.customer_name ? ` • ${order.customer_name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-black tracking-wider uppercase border ${status.bg} ${status.text} ${status.border}`}>
                          {status.label}
                        </span>
                        {order.created_at && (
                          <span className="text-[0.65rem] text-[#8E847C] font-mono tabular-nums">
                            <Clock className="w-3 h-3 inline-block mr-0.5 -mt-px" />
                            {getElapsed(order.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2.5 p-4 flex-1">
                    {order.order_items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-[#0E0B0A] rounded-xl px-4 py-3 border border-[#FFFFFF]/06">
                        <div className="flex justify-between items-center text-sm font-bold text-white">
                          <span>{item.item_name}</span>
                          <span className="text-[#C29B7F] text-base ml-2">×{item.quantity}</span>
                        </div>
                        {item.order_item_modifiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.order_item_modifiers.map((m: any, mIdx: number) => (
                              <span key={mIdx} className="px-2 py-0.5 rounded-md bg-[#C29B7F]/10 text-[#C29B7F] text-[0.68rem] font-medium border border-[#C29B7F]/15">
                                {m.option_label}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-red-400 mt-1.5 italic font-medium">
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-[#FFFFFF]/08 bg-[#0E0B0A]">
                    {order.order_status === 'NEW_ORDER' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white font-black text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        <Flame className="w-5 h-5" />
                        <span>MULAI MASAK</span>
                      </button>
                    )}
                    {order.order_status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0A0807] font-black text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>SIAP DIANTAR</span>
                      </button>
                    )}
                    {order.order_status === 'READY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-black text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>SELESAI PESANAN</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
