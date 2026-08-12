'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Edit2,
  Trash2,
  Printer,
  Copy,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'menu' | 'tables'>('verification');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Bukti transfer buram / tidak terbaca');
  const [customReason, setCustomReason] = useState('');
  const [rejectedWhatsAppLink, setRejectedWhatsAppLink] = useState<string | null>(null);

  // Stock & Table State
  const [menuItemsState, setMenuItemsState] = useState<any[]>([]);
  const [tablesState, setTablesState] = useState<any[]>([]);

  // Table Modals State
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [viewingQrTable, setViewingQrTable] = useState<any | null>(null);

  // Table Form Inputs
  const [tableCodeInput, setTableCodeInput] = useState('');
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableAreaInput, setTableAreaInput] = useState('Indoor AC');

  // Menu Modals State
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);

  // Menu Form Inputs
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('coffee');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuImg, setMenuImg] = useState('');
  const [menuTemp, setMenuTemp] = useState('Hot / Ice');

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

  // Rejection with Reason & WhatsApp Format Link
  const handleConfirmRejection = async () => {
    if (!rejectingOrder) return;
    const finalReason = rejectionReason === 'Custom' ? customReason : rejectionReason;
    if (!finalReason.trim()) return;

    try {
      const supabase = createClient();
      await supabase.from('orders').update({
        payment_status: 'REJECTED',
        rejection_reason: finalReason
      }).eq('id', rejectingOrder.id);

      // Format WhatsApp Message
      let phone = (rejectingOrder.customer_phone || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) {
        phone = '62' + phone.slice(1);
      }

      const waText = encodeURIComponent(
        `Halo Kak *${rejectingOrder.customer_name || 'Pelanggan'}*,\n\n` +
        `Mohon maaf, pembayaran untuk Pesanan *#${rejectingOrder.order_number}* di KOPIMAGE belum dapat kami verifikasi.\n\n` +
        `📌 *Alasan Penolakan:* ${finalReason}\n\n` +
        `Silakan melakukan upload ulang bukti pembayaran yang benar atau hubungi kasir kami di lokasi kedai. Terima kasih!`
      );

      const waUrl = `https://wa.me/${phone}?text=${waText}`;
      setRejectedWhatsAppLink(waUrl);

      // Remove from pending list
      setPendingPayments((prev) => prev.filter((p) => p.id !== rejectingOrder.id));

      // Auto open WhatsApp link if phone exists
      if (phone) {
        window.open(waUrl, '_blank');
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setRejectingOrder(null);
    }
  };

  // TABLE CRUD HANDLERS
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCodeInput.trim()) return;

    try {
      const supabase = createClient();
      if (editingTable) {
        // Edit existing table
        const { error } = await supabase.from('tables').update({
          code: tableCodeInput.padStart(2, '0'),
          name: tableNameInput || `MEJA ${tableCodeInput.padStart(2, '0')}`,
          area: tableAreaInput
        }).eq('id', editingTable.id);

        if (!error) {
          setTablesState(prev => prev.map(t => t.id === editingTable.id ? { ...t, code: tableCodeInput.padStart(2, '0'), name: tableNameInput || `MEJA ${tableCodeInput.padStart(2, '0')}`, area: tableAreaInput } : t));
        }
      } else {
        // Create new table
        const newCode = tableCodeInput.padStart(2, '0');
        const newName = tableNameInput || `MEJA ${newCode}`;
        const { data, error } = await supabase.from('tables').insert([{
          code: newCode,
          name: newName,
          area: tableAreaInput,
          is_active: true
        }]).select();

        if (!error && data) {
          setTablesState(prev => [...prev, data[0]]);
        } else {
          // Fallback local addition if table DB has mock schema
          setTablesState(prev => [...prev, { id: `table_${Date.now()}`, code: newCode, name: newName, area: tableAreaInput, is_active: true }]);
        }
      }
    } catch (err) {
      console.error('Save table error:', err);
    } finally {
      setIsAddTableOpen(false);
      setEditingTable(null);
      setTableCodeInput('');
      setTableNameInput('');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus nomor meja ini?')) return;
    try {
      const supabase = createClient();
      await supabase.from('tables').delete().eq('id', tableId);
      setTablesState(prev => prev.filter(t => t.id !== tableId));
    } catch (err) {
      console.error('Delete table error:', err);
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

  // MENU CRUD HANDLERS
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim() || !menuPrice) return;

    try {
      const supabase = createClient();
      const numPrice = parseInt(menuPrice.replace(/[^0-9]/g, '')) || 25000;
      const formattedPrice = `Rp ${numPrice.toLocaleString('id-ID')}`;

      if (editingMenu) {
        // Edit menu item
        const { error } = await supabase.from('menu_items').update({
          name: menuName,
          category: menuCategory,
          base_price: numPrice,
          price: formattedPrice,
          description: menuDesc,
          image: menuImg || editingMenu.image,
          temperature: menuTemp
        }).eq('id', editingMenu.id);

        if (!error) {
          setMenuItemsState(prev => prev.map(m => m.id === editingMenu.id ? { ...m, name: menuName, category: menuCategory, base_price: numPrice, price: formattedPrice, description: menuDesc, image: menuImg || m.image } : m));
        }
      } else {
        // Add new menu item
        const { data, error } = await supabase.from('menu_items').insert([{
          name: menuName,
          category: menuCategory,
          base_price: numPrice,
          price: formattedPrice,
          description: menuDesc,
          image: menuImg || '/images/kopimage_hero_atmosphere_1786480906850.png',
          temperature: menuTemp,
          is_available: true
        }]).select();

        if (!error && data) {
          setMenuItemsState(prev => [...prev, data[0]]);
        } else {
          setMenuItemsState(prev => [...prev, {
            id: `menu_${Date.now()}`,
            name: menuName,
            category: menuCategory,
            base_price: numPrice,
            price: formattedPrice,
            description: menuDesc,
            image: menuImg || '/images/kopimage_hero_atmosphere_1786480906850.png',
            is_available: true
          }]);
        }
      }
    } catch (err) {
      console.error('Save menu error:', err);
    } finally {
      setIsAddMenuOpen(false);
      setEditingMenu(null);
      setMenuName('');
      setMenuPrice('');
      setMenuDesc('');
      setMenuImg('');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini dari katalog QR?')) return;
    try {
      const supabase = createClient();
      await supabase.from('menu_items').delete().eq('id', menuId);
      setMenuItemsState(prev => prev.filter(m => m.id !== menuId));
    } catch (err) {
      console.error('Delete menu error:', err);
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

  const filteredMenuItems = menuItemsState.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTables = tablesState.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0E0B0A] text-[#FFFFFF] font-sans pb-16 selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      {/* Operations Header */}
      <header className="sticky top-0 z-40 bg-[#161210]/95 backdrop-blur-md border-b border-[#FFFFFF]/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#B82E2E] flex items-center justify-center shadow-lg shadow-[#B82E2E]/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#B82E2E]">KOPIMAGE MANAGEMENT HUB</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-light text-white leading-tight">Admin Operations Center</h1>
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
                <span>Kelola Menu</span>
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'tables'
                    ? 'bg-[#B82E2E] text-white shadow-md'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>Kelola Meja QR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* KPI Metrics Summary */}
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
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">TOTAL MENU KATALOG</span>
              <span className="text-2xl font-serif font-bold text-white">{menuItemsState.length} Item</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#B82E2E]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">STOK READY</span>
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
              <span className="text-[0.65rem] tracking-widest uppercase text-[#A89F91] block mb-1">REGISTER MEJA QR</span>
              <span className="text-2xl font-serif font-bold text-[#C29B7F]">
                {tablesState.length} Meja
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
              <div className="p-12 rounded-3xl bg-[#161210] border border-emerald-500/30 text-center max-w-lg mx-auto my-12 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-serif text-white mb-1">Semua Pembayaran Terverifikasi</h3>
                <p className="text-xs text-[#A89F91]">Tidak ada transaksi transfer / QRIS yang pending saat ini.</p>
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
                            <span>Nama Pemesan:</span>
                            <strong className="text-white font-medium">{p.customer_name}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>No. WhatsApp:</span>
                            <strong className="text-emerald-400 font-mono">{p.customer_phone || '-'}</strong>
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

                        {/* Payment Proof Lightbox Preview */}
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
                          onClick={() => setRejectingOrder(p)}
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

        {/* TAB 2: MENU MANAGEMENT */}
        {activeTab === 'menu' && (
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Kelola Katalog Menu QR Kedai</h2>
                <p className="text-xs text-[#A89F91]">Tambah, edit, hapus, dan atur ketersediaan stok menu untuk pesanan QR meja.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingMenu(null);
                    setMenuName('');
                    setMenuPrice('');
                    setMenuDesc('');
                    setIsAddMenuOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => {
                const isAvailable = item.is_available !== false;
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isAvailable
                        ? 'bg-[#161210] border-[#FFFFFF]/10 hover:border-[#B82E2E]/40'
                        : 'bg-[#120F0E] border-red-500/20 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0E0B0A] border border-[#FFFFFF]/10 shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#A89F91]">
                              <Coffee className="w-6 h-6 text-[#B82E2E]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <span className="px-2 py-0.5 rounded bg-[#B82E2E]/20 text-[#C29B7F] text-[0.6rem] font-sans tracking-wider uppercase font-semibold border border-[#B82E2E]/30 mb-1 inline-block">
                            {item.category || 'KOPI'}
                          </span>
                          <h4 className="font-serif text-base font-normal text-white">{item.name}</h4>
                          <span className="font-serif text-sm font-semibold text-[#C29B7F]">
                            {item.price || `Rp ${item.base_price?.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#A89F91] line-clamp-2 mb-4 font-light leading-relaxed">
                        {item.description || 'Racikan khas berkualitas KOPIMAGE.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#FFFFFF]/10 flex items-center justify-between">
                      <button
                        onClick={() => toggleStock(item.id, isAvailable)}
                        className={`flex items-center gap-1.5 text-xs font-semibold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        <span>{isAvailable ? 'Tersedia' : 'Habis'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMenu(item);
                            setMenuName(item.name);
                            setMenuCategory(item.category || 'coffee');
                            setMenuPrice(item.base_price ? String(item.base_price) : '25000');
                            setMenuDesc(item.description || '');
                            setIsAddMenuOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#0E0B0A] hover:bg-[#FFFFFF]/10 text-white transition-colors cursor-pointer"
                          title="Edit Menu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.id)}
                          className="p-2 rounded-lg bg-[#0E0B0A] hover:bg-red-950 text-red-400 transition-colors cursor-pointer"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: TABLE REGISTRY CONTROL & QR STICKER GENERATOR */}
        {activeTab === 'tables' && (
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Manajemen Registry Meja &amp; Generator Kode QR</h2>
                <p className="text-xs text-[#A89F91]">Tambah, edit, hapus meja dan lihat/cetak stiker Kode QR khusus tiap meja.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari meja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingTable(null);
                    setTableCodeInput('');
                    setTableNameInput('');
                    setIsAddTableOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Meja</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTables.map((t) => {
                const isActive = t.is_active !== false;
                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-[#161210] border-[#FFFFFF]/10 hover:border-[#B82E2E]/40'
                        : 'bg-[#120F0E] border-red-500/20 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-serif text-xl font-normal text-white">{t.name}</div>
                        <button
                          onClick={() => toggleTable(t.id, isActive)}
                          className="cursor-pointer"
                          title={isActive ? 'Aktif' : 'Non-Aktif'}
                        >
                          {isActive ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-red-400" />}
                        </button>
                      </div>
                      <span className="text-[0.65rem] tracking-wider uppercase text-[#A89F91] block mb-4">
                        Kode: {t.code} • Area: {t.area || 'Indoor AC'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#FFFFFF]/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setViewingQrTable(t)}
                        className="px-3 py-1.5 rounded-xl bg-[#B82E2E]/20 hover:bg-[#B82E2E] border border-[#B82E2E]/40 text-[#C29B7F] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Lihat QR</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTable(t);
                            setTableCodeInput(t.code);
                            setTableNameInput(t.name);
                            setTableAreaInput(t.area || 'Indoor AC');
                            setIsAddTableOpen(true);
                          }}
                          className="p-2 rounded-lg bg-[#0E0B0A] hover:bg-[#FFFFFF]/10 text-white transition-colors cursor-pointer"
                          title="Edit Meja"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(t.id)}
                          className="p-2 rounded-lg bg-[#0E0B0A] hover:bg-red-950 text-red-400 transition-colors cursor-pointer"
                          title="Hapus Meja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* MODAL 1: REJECTION REASON & WHATSAPP ALERT */}
      <AnimatePresence>
        {rejectingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingOrder(null)}
              className="fixed inset-0 bg-[#0E0B0A]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#161210] border border-red-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFFFFF]/10">
                <div className="flex items-center gap-2 text-red-400 font-serif text-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>Alasan Penolakan Pembayaran #{rejectingOrder.order_number}</span>
                </div>
                <button onClick={() => setRejectingOrder(null)} className="text-[#A89F91] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-2">
                    PILIH TEMPLATE ALASAN CEPAT:
                  </label>
                  <div className="space-y-2">
                    {[
                      'Bukti transfer buram / tidak terbaca',
                      'Nominal transfer kurang / tidak sesuai',
                      'Bukti bayar tidak sesuai QRIS KOPIMAGE',
                      'Custom'
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setRejectionReason(reason)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          rejectionReason === reason
                            ? 'bg-[#B82E2E]/20 border-[#B82E2E] text-white'
                            : 'bg-[#0E0B0A] border-[#FFFFFF]/10 text-[#A89F91] hover:text-white'
                        }`}
                      >
                        {reason === 'Custom' ? '✍️ Tulis Alasan Khusus Lainnya...' : `📌 ${reason}`}
                      </button>
                    ))}
                  </div>
                </div>

                {rejectionReason === 'Custom' && (
                  <div>
                    <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">
                      Tulis Alasan Spesifik:
                    </label>
                    <textarea
                      rows={3}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="misal: Mohon upload foto bukti transfer yang menampilkan nomor referensi bank..."
                      className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmRejection}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>TOLAK &amp; KIRIM KE WHATSAPP</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: QR CODE VIEW & PRINT STICKER */}
      <AnimatePresence>
        {viewingQrTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingQrTable(null)}
              className="fixed inset-0 bg-[#0E0B0A]/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-md bg-[#161210] border border-[#B82E2E]/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl"
            >
              <button onClick={() => setViewingQrTable(null)} className="absolute top-4 right-4 text-[#A89F91] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className="text-[0.65rem] tracking-widest uppercase font-semibold text-[#C29B7F] block">KOPIMAGE STIKER MEJA</span>
                <h3 className="font-serif text-2xl font-light text-white">{viewingQrTable.name}</h3>
                <span className="text-xs text-[#A89F91]">Kode: {viewingQrTable.code} • Area: {viewingQrTable.area}</span>
              </div>

              {/* QR Canvas Box */}
              <div className="bg-white p-6 rounded-2xl inline-block border-4 border-[#B82E2E] shadow-2xl mb-6 my-2">
                <QRCodeSVG
                  value={`https://kopimage.vercel.app/experience?table=${viewingQrTable.code}`}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0E0B0A"
                  level="H"
                />
                <span className="font-sans text-[0.6rem] tracking-widest uppercase text-black font-bold block mt-3">
                  SCAN TO ORDER • MEJA {viewingQrTable.code}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://kopimage.vercel.app/experience?table=${viewingQrTable.code}`);
                    alert('Link QR Meja berhasil disalin!');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#0E0B0A] hover:bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-[#C29B7F]" />
                  <span>SALIN LINK</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>CETAK STIKER</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADD/EDIT TABLE */}
      <AnimatePresence>
        {isAddTableOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddTableOpen(false)}
              className="fixed inset-0 bg-[#0E0B0A]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#161210] border border-[#B82E2E]/40 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFFFFF]/10">
                <h3 className="font-serif text-lg text-white">
                  {editingTable ? 'Edit Data Meja' : 'Tambah Meja Baru'}
                </h3>
                <button onClick={() => setIsAddTableOpen(false)} className="text-[#A89F91] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTable} className="space-y-4">
                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Kode Meja (misal: 13)</label>
                  <input
                    type="text"
                    required
                    placeholder="13"
                    value={tableCodeInput}
                    onChange={(e) => setTableCodeInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Nama Meja (misal: MEJA 13)</label>
                  <input
                    type="text"
                    placeholder="MEJA 13"
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Area Lokasi Kedai</label>
                  <select
                    value={tableAreaInput}
                    onChange={(e) => setTableAreaInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white outline-none focus:border-[#B82E2E]"
                  >
                    <option value="Indoor AC">Indoor AC</option>
                    <option value="Outdoor Teras">Outdoor Teras</option>
                    <option value="VIP Bar">VIP Bar</option>
                    <option value="Soreang Garden">Soreang Garden</option>
                    <option value="Sulaiman Airfield">Sulaiman Airfield</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
                >
                  SIMPAN MEJA
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ADD/EDIT MENU */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMenuOpen(false)}
              className="fixed inset-0 bg-[#0E0B0A]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#161210] border border-[#B82E2E]/40 rounded-3xl p-6 shadow-2xl my-auto text-white"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFFFFF]/10">
                <h3 className="font-serif text-lg text-white">
                  {editingMenu ? 'Edit Menu Katalog QR' : 'Tambah Menu Katalog QR Baru'}
                </h3>
                <button onClick={() => setIsAddMenuOpen(false)} className="text-[#A89F91] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-4">
                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Nama Menu *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Es Kopi Susu Signature"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Kategori</label>
                    <select
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white outline-none focus:border-[#B82E2E]"
                    >
                      <option value="coffee">KOPI RACIKAN</option>
                      <option value="non-coffee">NON-COFFEE &amp; TEA</option>
                      <option value="main-course">MAKANAN &amp; MIE</option>
                      <option value="cemilan-asin">CEMILAN ASIN</option>
                      <option value="cemilan-manis">CEMILAN MANIS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Harga (Rp) *</label>
                    <input
                      type="text"
                      required
                      placeholder="25000"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">URL Foto Menu</label>
                  <input
                    type="text"
                    placeholder="/images/kopimage_hero_atmosphere_1786480906850.png"
                    value={menuImg}
                    onChange={(e) => setMenuImg(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div>
                  <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1">Deskripsi Menu</label>
                  <textarea
                    rows={3}
                    placeholder="Racikan khas berkualitas disajikan hangat di Kopi Mage."
                    value={menuDesc}
                    onChange={(e) => setMenuDesc(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
                >
                  SIMPAN MENU KATALOG
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
