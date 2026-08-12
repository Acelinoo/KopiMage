'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  RefreshCw,
  Search,
  Coffee,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'menu' | 'tables'>('verification');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Availability & Tables State
  const [menuItemsState, setMenuItemsState] = useState<any[]>([]);
  const [tablesState, setTablesState] = useState<any[]>([]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Fetch VERIFYING orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'VERIFYING')
        .order('created_at', { ascending: false });

      if (!ordersErr && ordersData) {
        setPendingPayments(ordersData);

        // Generate Signed URLs for each order with payment_proof_url
        const urlsMap: Record<string, string> = {};
        for (const order of ordersData) {
          if (order.payment_proof_url) {
            const cleanPath = order.payment_proof_url.replace(/^payment-proofs\//, '');
            const { data: signedData } = await supabase.storage
              .from('payment-proofs')
              .createSignedUrl(cleanPath, 3600);

            if (signedData?.signedUrl) {
              urlsMap[order.id] = signedData.signedUrl;
            }
          }
        }
        setSignedUrls(urlsMap);
      }

      // 2. Fetch Menu Items
      const { data: menuData } = await supabase.from('menu_items').select('*').order('name');
      if (menuData) setMenuItemsState(menuData);

      // 3. Fetch Tables
      const { data: tablesData } = await supabase.from('tables').select('*').order('code');
      if (tablesData) setTablesState(tablesData);

    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprovePayment = async (orderId: string) => {
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ payment_status: 'PAID' }).eq('id', orderId);
      setPendingPayments((prev) => prev.filter((p) => p.id !== orderId));
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ payment_status: 'REJECTED' }).eq('id', orderId);
      setPendingPayments((prev) => prev.filter((p) => p.id !== orderId));
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const toggleStock = async (itemId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', itemId);
      setMenuItemsState((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, is_available: !currentStatus } : item))
      );
    } catch (err) {
      console.error('Stock toggle failed:', err);
    }
  };

  const toggleTable = async (tableId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      await supabase.from('tables').update({ is_active: !currentStatus }).eq('id', tableId);
      setTablesState((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, is_active: !currentStatus } : t))
      );
    } catch (err) {
      console.error('Table toggle failed:', err);
    }
  };

  const filteredMenuItems = menuItemsState.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTables = tablesState.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0E0B0A] text-[#FFFFFF] font-sans pb-16 selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      {/* Top Operations Header */}
      <header className="sticky top-0 z-40 bg-[#161210]/95 backdrop-blur-md border-b border-[#FFFFFF]/10 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B82E2E] flex items-center justify-center shadow-lg shadow-[#B82E2E]/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#B82E2E]">KOPIMAGE OPERATIONS HUB</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-light text-white leading-tight">Admin & System Control</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchAdminData}
              className="p-3 rounded-xl border border-[#FFFFFF]/15 bg-[#0E0B0A] text-[#A89F91] hover:text-white hover:border-[#B82E2E] transition-all cursor-pointer shadow-sm"
              title="Refresh Real-time Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Navigation Tabs */}
            <div className="flex bg-[#0E0B0A] p-1 rounded-xl border border-[#FFFFFF]/10 gap-1">
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'verification'
                    ? 'bg-[#B82E2E] text-white shadow-md'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>Verifikasi</span>
                {pendingPayments.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white text-[#B82E2E] text-[0.65rem] font-bold">
                    {pendingPayments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'menu'
                    ? 'bg-[#B82E2E] text-white shadow-md'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>Stok Menu</span>
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'tables'
                    ? 'bg-[#B82E2E] text-white shadow-md'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>Meja QR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* KPI Metrics Dashboard Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#161210] border border-[#B82E2E]/30 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">VERIFIKASI PENDING</span>
              <span className="text-2xl font-serif font-bold text-white">{pendingPayments.length} Pesanan</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">TOTAL MENU TERDAFTAR</span>
              <span className="text-2xl font-serif font-bold text-white">{menuItemsState.length} Item</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#B82E2E]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">STOK TERSEDIA</span>
              <span className="text-2xl font-serif font-bold text-emerald-400">
                {menuItemsState.filter(i => i.is_available !== false).length} Ready
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">MEJA AKTIF QR</span>
              <span className="text-2xl font-serif font-bold text-[#C29B7F]">
                {tablesState.filter(t => t.is_active !== false).length} Meja
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C29B7F]/15 border border-[#C29B7F]/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#C29B7F]" />
            </div>
          </div>
        </div>

        {/* TAB 1: VERIFICATION QUEUE */}
        {activeTab === 'verification' && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Antrean Verifikasi Bukti Pembayaran QRIS / Transfer</h2>
                <p className="text-xs text-[#A89F91]">Verifikasi bukti bayar pelanggan untuk meneruskan order ke Dapur &amp; Barista.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-24 text-[#A89F91]">
                <RefreshCw className="w-5 h-5 animate-spin text-[#B82E2E]" />
                <span className="text-sm">Memuat antrean verifikasi...</span>
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#161210] border border-emerald-500/30 text-center max-w-lg mx-auto my-12">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-serif text-white mb-1">Semua Pembayaran Lunas &amp; Terverifikasi</h3>
                <p className="text-xs text-[#A89F91]">Tidak ada transaksi transfer / QRIS yang tertahan di antrean saat ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPayments.map((p) => {
                  const proofSignedUrl = signedUrls[p.id];
                  return (
                    <div key={p.id} className="p-6 rounded-2xl bg-[#161210] border border-[#B82E2E]/40 flex flex-col justify-between shadow-xl">
                      <div>
                        <div className="flex items-center justify-between mb-4 border-b border-[#FFFFFF]/10 pb-3">
                          <span className="font-serif text-lg font-bold text-white">{p.order_number}</span>
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[0.65rem] font-sans tracking-wider uppercase font-bold">
                            {p.payment_status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-[#A89F91] mb-5">
                          <div className="flex justify-between">
                            <span>Pelanggan:</span>
                            <strong className="text-white font-medium">{p.customer_name}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Nominal Total:</span>
                            <strong className="text-[#C29B7F] font-serif text-sm font-semibold">Rp {p.subtotal?.toLocaleString('id-ID')}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Metode:</span>
                            <span className="uppercase text-[#FFFFFF] font-semibold">{p.payment_method}</span>
                          </div>
                        </div>

                        {/* Payment Proof Lightbox Preview Box */}
                        <div className="bg-[#0E0B0A] p-3 rounded-xl border border-dashed border-[#B82E2E]/30 text-center mb-6">
                          {proofSignedUrl ? (
                            <div>
                              <div className="relative h-44 w-full rounded-lg overflow-hidden mb-2 cursor-pointer group" onClick={() => setSelectedImageModal(proofSignedUrl)}>
                                <img
                                  src={proofSignedUrl}
                                  alt="Bukti Transfer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-[#0E0B0A]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                                  <Eye className="w-4 h-4 text-[#B82E2E]" />
                                  <span>Perbesar Gambar</span>
                                </div>
                              </div>
                              <a
                                href={proofSignedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[0.7rem] text-[#C29B7F] hover:text-white font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka Ukuran Asli</span>
                              </a>
                            </div>
                          ) : (
                            <div className="py-8 text-[#A89F91]">
                              <Eye className="w-6 h-6 text-[#B82E2E] mx-auto mb-1.5" />
                              <span className="text-xs">Tidak ada foto bukti bayar terlampir</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Approval Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApprovePayment(p.id)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="w-full py-2.5 rounded-xl bg-[#0E0B0A] hover:bg-red-950 border border-red-500/40 text-red-400 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MENU STOCK CONTROL */}
        {activeTab === 'menu' && (
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Kontrol Ketersediaan Stok Menu</h2>
                <p className="text-xs text-[#A89F91]">Aktifkan atau matikan ketersediaan item menu secara instan real-time.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => {
                const isAvailable = item.is_available !== false;
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      isAvailable
                        ? 'bg-[#161210] border-[#FFFFFF]/10 hover:border-[#B82E2E]/40'
                        : 'bg-[#120F0E] border-red-500/20 opacity-75'
                    }`}
                  >
                    <div>
                      <h4 className="font-serif text-base font-normal text-white mb-0.5">{item.name}</h4>
                      <span className="font-serif text-xs text-[#C29B7F]">
                        Rp {item.base_price?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleStock(item.id, isAvailable)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        isAvailable
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/15 border-red-500/30 text-red-400'
                      }`}
                    >
                      {isAvailable ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-red-400" />}
                      <span>{isAvailable ? 'TERSEDIA' : 'HABIS'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: TABLE REGISTRY CONTROL */}
        {activeTab === 'tables' && (
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Manajemen Registry Meja QR</h2>
                <p className="text-xs text-[#A89F91]">Aktifkan atau non-aktifkan nomor meja pemesanan QR di lokasi kedai.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari nomor/kode meja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTables.map((t) => {
                const isActive = t.is_active !== false;
                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-[#161210] border-[#FFFFFF]/10 hover:border-[#B82E2E]/40'
                        : 'bg-[#120F0E] border-red-500/20 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="font-serif text-lg font-normal text-white">{t.name}</div>
                      <span className="text-[0.65rem] tracking-wider uppercase text-[#A89F91] block">Kode: {t.code} • {t.area || 'Area Kedai'}</span>
                    </div>

                    <button
                      onClick={() => toggleTable(t.id, isActive)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/15 border-red-500/30 text-red-400'
                      }`}
                      title={isActive ? 'Meja Aktif' : 'Meja Non-Aktif'}
                    >
                      {isActive ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-red-400" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Image Lightbox Fullscreen Modal */}
      <AnimatePresence>
        {selectedImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImageModal(null)}
              className="fixed inset-0 bg-[#0E0B0A]/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 max-w-3xl max-h-[85vh] p-2 bg-[#161210] border border-[#B82E2E]/40 rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#0E0B0A]/80 text-white hover:bg-[#B82E2E] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedImageModal}
                alt="Bukti Transfer Penuh"
                className="w-full h-full object-contain rounded-2xl max-h-[80vh]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
