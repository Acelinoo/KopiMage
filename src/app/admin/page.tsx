'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
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
  Send,
  Smartphone,
  ExternalLink,
  Filter,
  CheckSquare,
  FileText,
  Upload as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'menu' | 'tables'>('verification');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'VERIFYING' | 'PAID' | 'REJECTED' | 'ALL'>('VERIFYING');

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Bukti transfer buram / tidak terbaca');
  const [customReason, setCustomReason] = useState('');

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

  // Real-time API Fetcher (Always fetches ALL orders to guarantee 0 data loss across tabs)
  const fetchAdminOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders?status=ALL');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrdersList(data.orders);
        safeSetLocalStorage('kopimage_admin_orders_cache_v4', JSON.stringify(data.orders));
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
      try {
        const cached = localStorage.getItem('kopimage_admin_orders_cache_v4');
        if (cached) {
          setOrdersList(JSON.parse(cached));
        }
      } catch (e) {}
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      // 1. MENU SYNC
      const isMenuCleared = typeof window !== 'undefined' && localStorage.getItem('kopimage_menu_cleared') === 'true';
      const localCustomMenu = typeof window !== 'undefined' ? localStorage.getItem('kopimage_custom_menu_v3') : null;
      let parsedCustomMenu: any[] = localCustomMenu ? JSON.parse(localCustomMenu) : [];

      if (isMenuCleared && parsedCustomMenu.length === 0) {
        setMenuItemsState([]);
      } else {
        try {
          const menuRes = await fetch('/api/menu');
          const menuData = await menuRes.json();
          if (menuData.success && Array.isArray(menuData.menu)) {
            const apiIds = new Set(menuData.menu.map((m: any) => m.id));
            const merged = [...menuData.menu, ...parsedCustomMenu.filter((m: any) => !apiIds.has(m.id))];
            setMenuItemsState(merged);
          }
        } catch (e) {
          setMenuItemsState(parsedCustomMenu);
        }
      }

      // 2. TABLES SYNC
      const isTablesCleared = typeof window !== 'undefined' && localStorage.getItem('kopimage_tables_cleared') === 'true';
      const localCustomTables = typeof window !== 'undefined' ? localStorage.getItem('kopimage_custom_tables_v3') : null;
      let parsedCustomTables: any[] = localCustomTables ? JSON.parse(localCustomTables) : [];

      if (isTablesCleared && parsedCustomTables.length === 0) {
        setTablesState([]);
      } else {
        try {
          const tablesRes = await fetch('/api/tables');
          const tablesData = await tablesRes.json();
          if (tablesData.success && Array.isArray(tablesData.tables)) {
            const apiCodes = new Set(tablesData.tables.map((t: any) => t.code || t.id));
            const merged = [...tablesData.tables, ...parsedCustomTables.filter((t: any) => !apiCodes.has(t.code || t.id))];
            setTablesState(merged);
          }
        } catch (e) {
          setTablesState(parsedCustomTables);
        }
      }
    } catch (err) {
      console.error('Failed to fetch auxiliary data:', err);
    }
  };

  const sanitizeMenuForStorage = (items: any[]) => {
    return items.map((item) => {
      const cleanImage =
        item.image && item.image.startsWith('data:')
          ? '/images/kopimage_hero_atmosphere_1786480906850.png'
          : item.image;
      return {
        ...item,
        image: cleanImage,
      };
    });
  };

  useEffect(() => {
    fetchAdminOrders(true);
    fetchAuxiliaryData();

    // Auto-polling every 4 seconds for live sync
    const interval = setInterval(() => fetchAdminOrders(false), 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Approve Handler (100% DB Persistent)
  const handleApprovePayment = async (orderId: string) => {
    try {
      // Optimistic UI update
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'PAID' } : o)));

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          payment_status: 'PAID',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengubah status di server');
      }

      // Re-fetch to ensure 100% DB alignment
      fetchAdminOrders(false);
    } catch (err) {
      console.error('Approve error:', err);
      alert('Gagal memverifikasi pembayaran. Silakan coba lagi.');
      fetchAdminOrders(false);
    }
  };

  // Real-time Reject Handler with WhatsApp Direct Deep Link
  const handleConfirmRejection = async () => {
    if (!rejectingOrder) return;
    const finalReason = rejectionReason === 'Custom' ? customReason : rejectionReason;
    if (!finalReason.trim()) return;

    try {
      // Optimistic UI update
      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === rejectingOrder.id
            ? { ...o, payment_status: 'REJECTED', rejection_reason: finalReason }
            : o
        )
      );

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: rejectingOrder.id,
          payment_status: 'REJECTED',
          rejection_reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menolak pesanan di server');
      }

      // Format WhatsApp Deep Link
      let phone = (rejectingOrder.customer_phone || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) {
        phone = '62' + phone.slice(1);
      }

      const waText = encodeURIComponent(
        `Halo Kak *${rejectingOrder.customer_name || 'Pelanggan'}*,\n\n` +
        `Mohon maaf, bukti pembayaran untuk Pesanan *#${rejectingOrder.order_number}* di KOPIMAGE belum dapat kami verifikasi.\n\n` +
        `📌 *Alasan Penolakan:* ${finalReason}\n\n` +
        `Silakan unggah ulang foto bukti transfer yang jelas melalui link pesanan Anda atau hubungi kasir kami di kedai. Terima kasih!`
      );

      const waUrl = `https://wa.me/${phone}?text=${waText}`;

      // Open WhatsApp direct chat
      if (phone) {
        window.open(waUrl, '_blank');
      }

      fetchAdminOrders(false);
    } catch (err) {
      console.error('Reject error:', err);
      alert('Gagal menolak pesanan. Silakan coba lagi.');
      fetchAdminOrders(false);
    } finally {
      setRejectingOrder(null);
    }
  };

  // TABLE CRUD HANDLERS (Real-time DB & API & Local Storage Synchronized)
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCodeInput.trim()) return;

    try {
      const newCode = tableCodeInput.padStart(2, '0');
      const newName = tableNameInput || `MEJA ${newCode}`;
      const newArea = tableAreaInput || 'Indoor AC';

      const newTableObj = {
        id: editingTable?.id || `table_${newCode}_${Date.now()}`,
        code: newCode,
        name: newName,
        area: newArea,
        is_active: true,
      };

      // Unset cleared flag & Update state immediately
      try {
        localStorage.removeItem('kopimage_tables_cleared');
      } catch (e) {}

      setTablesState((prev) => {
        const updated = [...prev.filter((t) => t.id !== newTableObj.id && t.code !== newCode), newTableObj];
        safeSetLocalStorage('kopimage_custom_tables_v3', JSON.stringify(updated));
        return updated;
      });

      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          area: newArea,
        }),
      });
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
      setTablesState((prev) => {
        const updated = prev.filter((t) => t.id !== tableId && t.code !== tableId);
        safeSetLocalStorage('kopimage_custom_tables_v3', JSON.stringify(updated));
        if (updated.length === 0) {
          safeSetLocalStorage('kopimage_tables_cleared', 'true');
        }
        return updated;
      });

      await fetch(`/api/tables?id=${tableId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete table error:', err);
    }
  };

  const handleClearAllTables = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA MEJA? Anda dapat menambah meja baru secara manual setelah ini.')) return;
    try {
      try {
        safeSetLocalStorage('kopimage_tables_cleared', 'true');
        localStorage.removeItem('kopimage_custom_tables_v3');
      } catch (e) {}
      setTablesState([]);

      await fetch('/api/tables?all=true', { method: 'DELETE' });
    } catch (err) {
      console.error('Clear all tables error:', err);
    }
  };

  // SAFE LOCAL STORAGE HELPER (Anti-QuotaExceededError)
  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage quota exceeded for ${key}, cleaning stale keys:`, e);
      try {
        localStorage.removeItem('kopimage_custom_menu');
        localStorage.removeItem('kopimage_custom_tables');
        localStorage.removeItem('kopimage_custom_menu_v2');
        localStorage.removeItem('kopimage_custom_tables_v2');
        localStorage.setItem(key, value);
      } catch (err) {
        console.warn('LocalStorage save skipped due to browser quota limit:', err);
      }
    }
  };

  // IMAGE FILE UPLOAD HANDLER WITH CANVAS COMPRESSION (MAX 600px JPEG)
  const handleMenuImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setMenuImg(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // MENU CRUD HANDLERS (Real-time DB & API & Local Storage Synchronized)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim() || !menuPrice) return;

    try {
      const numPrice = parseInt(menuPrice.replace(/[^0-9]/g, '')) || 25000;
      const formattedPrice = `Rp ${numPrice.toLocaleString('id-ID')}`;
      const menuId = editingMenu?.id || `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newMenuObj = {
        id: menuId,
        name: menuName,
        category: menuCategory,
        price: formattedPrice,
        base_price: numPrice,
        description: menuDesc || 'Racikan khas berkualitas disajikan hangat di KOPIMAGE.',
        image: menuImg || editingMenu?.image || '/images/kopimage_hero_atmosphere_1786480906850.png',
        temperature: menuTemp || 'Hot / Ice',
        is_available: true,
      };

      // Unset cleared flag & Update state immediately
      try {
        localStorage.removeItem('kopimage_menu_cleared');
      } catch (e) {}

      setMenuItemsState((prev) => {
        const updated = [newMenuObj, ...prev.filter((m) => m.id !== newMenuObj.id)];
        safeSetLocalStorage('kopimage_custom_menu_v3', JSON.stringify(sanitizeMenuForStorage(updated)));
        return updated;
      });

      await fetch('/api/menu', {
        method: editingMenu ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenuObj),
      });
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
      setMenuItemsState((prev) => {
        const updated = prev.filter((m) => m.id !== menuId);
        safeSetLocalStorage('kopimage_custom_menu_v3', JSON.stringify(sanitizeMenuForStorage(updated)));
        if (updated.length === 0) {
          safeSetLocalStorage('kopimage_menu_cleared', 'true');
        }
        return updated;
      });

      await fetch(`/api/menu?id=${menuId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete menu error:', err);
    }
  };

  const handleClearAllMenu = async () => {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA MENU? Anda dapat menambah menu baru secara manual setelah ini.')) return;
    try {
      try {
        safeSetLocalStorage('kopimage_menu_cleared', 'true');
        localStorage.removeItem('kopimage_custom_menu_v3');
      } catch (e) {}
      setMenuItemsState([]);

      await fetch('/api/menu?all=true', { method: 'DELETE' });
    } catch (err) {
      console.error('Clear all menu error:', err);
    }
  };

  const filteredOrders = ordersList.filter((o) => {
    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_phone || '').includes(searchQuery) ||
      (o.table_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'VERIFYING') {
      return o.payment_status === 'VERIFYING' || o.payment_status === 'UNPAID';
    }
    if (statusFilter === 'PAID') {
      return o.payment_status === 'PAID';
    }
    if (statusFilter === 'REJECTED') {
      return o.payment_status === 'REJECTED';
    }
    return true; // ALL
  });

  const verifyingCount = ordersList.filter(
    (o) => o.payment_status === 'VERIFYING' || o.payment_status === 'UNPAID'
  ).length;
  const paidCount = ordersList.filter((o) => o.payment_status === 'PAID').length;
  const rejectedCount = ordersList.filter((o) => o.payment_status === 'REJECTED').length;
  const totalOrdersCount = ordersList.length;

  return (
    <main className="min-h-screen bg-[#0B0908] text-[#F7F4EF] font-sans pb-20 selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      {/* Industrial Craftsman Header */}
      <header className="sticky top-0 z-40 bg-[#120F0D]/95 backdrop-blur-md border-b border-[#FFFFFF]/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#B82E2E] flex items-center justify-center shadow-lg shadow-[#B82E2E]/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.65rem] tracking-widest uppercase font-mono text-[#C29B7F]">KOPIMAGE INDUSTRIAL COMMAND</span>
              </div>
              <h1 className="text-xl font-serif text-white font-normal leading-tight">Admin Operations Console</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchAdminOrders(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-[#FFFFFF]/15 bg-[#171311] text-[#C29B7F] hover:text-white hover:border-[#B82E2E] transition-all cursor-pointer shadow-sm flex items-center gap-2 text-xs font-mono"
              title="Refresh Sync Real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#B82E2E]' : ''}`} />
              <span>SYNC NOW</span>
            </button>

            {/* Industrial Navigation Tabs */}
            <div className="flex bg-[#0E0B0A] p-1 rounded-xl border border-[#FFFFFF]/10 gap-1">
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'verification'
                    ? 'bg-[#B82E2E] text-white shadow-md font-semibold'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>VERIFIKASI BAYAR</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white text-[#B82E2E] text-[0.65rem] font-bold font-mono">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'menu'
                    ? 'bg-[#B82E2E] text-white shadow-md font-semibold'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>KATALOG MENU</span>
              </button>

              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'tables'
                    ? 'bg-[#B82E2E] text-white shadow-md font-semibold'
                    : 'text-[#A89F91] hover:text-white'
                }`}
              >
                <span>MEJA QR</span>
              </button>

              <a
                href="/kitchen"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-[#C29B7F]/15 border border-[#C29B7F]/40 text-[#C29B7F] hover:bg-[#C29B7F] hover:text-[#070605] font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                title="Buka Monitor Dapur / Kitchen Display System"
              >
                <span>🔥 STASIUN DAPUR (KDS)</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* KPI Operations Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-[#161210] border border-[#B82E2E]/40 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[0.62rem] tracking-widest font-mono uppercase text-[#A89F91] block mb-1">VERIFIKASI PENDING</span>
              <span className="text-2xl font-serif font-semibold text-white">{verifyingCount} Pesanan</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[0.62rem] tracking-widest font-mono uppercase text-[#A89F91] block mb-1">TERVERIFIKASI LUNAS</span>
              <span className="text-2xl font-serif font-semibold text-emerald-400">
                {paidCount} Transaksi
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[0.62rem] tracking-widest font-mono uppercase text-[#A89F91] block mb-1">KATALOG MENU QR</span>
              <span className="text-2xl font-serif font-semibold text-white">{menuItemsState.length} Item</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#B82E2E]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[0.62rem] tracking-widest font-mono uppercase text-[#A89F91] block mb-1">TOTAL MEJA AKTIF</span>
              <span className="text-2xl font-serif font-semibold text-[#C29B7F]">{tablesState.length} Meja</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C29B7F]/15 border border-[#C29B7F]/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#C29B7F]" />
            </div>
          </div>
        </div>

        {/* TAB 1: VERIFICATION OPERATIONS CONSOLE */}
        {activeTab === 'verification' && (
          <section>
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-[#120F0D] p-4 rounded-2xl border border-[#FFFFFF]/10">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-mono text-[#A89F91] mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#B82E2E]" /> FILTER:
                </span>
                {(['VERIFYING', 'PAID', 'REJECTED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === st
                        ? 'bg-[#B82E2E] text-white font-semibold shadow-md'
                        : 'bg-[#0E0B0A] text-[#A89F91] hover:text-white border border-[#FFFFFF]/10'
                    }`}
                  >
                    <span>
                      {st === 'VERIFYING'
                        ? 'PENDING'
                        : st === 'PAID'
                        ? 'LUNAS'
                        : st === 'REJECTED'
                        ? 'DITOLAK'
                        : 'SEMUA'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[0.65rem] font-bold">
                      {st === 'VERIFYING'
                        ? verifyingCount
                        : st === 'PAID'
                        ? paidCount
                        : st === 'REJECTED'
                        ? rejectedCount
                        : totalOrdersCount}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari No. Order, Nama, WA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/15 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#A89F91]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#B82E2E]" />
                <span className="text-xs font-mono tracking-widest uppercase">Mengambil data transaksi real-time...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#120F0D] border border-emerald-500/30 text-center max-w-md mx-auto my-12 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-serif text-white mb-1">Tidak Ada Pesanan Dalam Status Ini</h3>
                <p className="text-xs text-[#A89F91]">Semua bukti pembayaran terverifikasi atau tidak ada data yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => {
                  const isVerifying = order.payment_status === 'VERIFYING';
                  const isPaid = order.payment_status === 'PAID';
                  const isRejected = order.payment_status === 'REJECTED';
                  const proofImg = order.payment_proof_url;

                  return (
                    <div
                      key={order.id}
                      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between shadow-xl relative overflow-hidden ${
                        isVerifying
                          ? 'bg-[#161210] border-[#B82E2E]/50'
                          : isPaid
                          ? 'bg-[#121613] border-emerald-500/30'
                          : 'bg-[#181111] border-red-500/30'
                      }`}
                    >
                      <div>
                        {/* Order Header Card */}
                        <div className="flex items-center justify-between mb-4 border-b border-[#FFFFFF]/10 pb-3">
                          <div>
                            <span className="font-serif text-lg font-bold text-white block leading-none mb-1">
                              {order.order_number}
                            </span>
                            <span className="text-[0.68rem] text-[#C29B7F] font-mono">
                              {order.mode === 'dine-in' ? `DINE-IN • MEJA ${order.table_id || '01'}` : 'TAKEAWAY'}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[0.65rem] font-mono tracking-wider uppercase font-bold border ${
                              isVerifying
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : isPaid
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/15 border-red-500/30 text-red-400'
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 text-xs text-[#A89F91] mb-5">
                          <div className="flex justify-between">
                            <span>Pemesan:</span>
                            <strong className="text-white font-medium">{order.customer_name}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>No. WhatsApp:</span>
                            <strong className="text-emerald-400 font-mono">{order.customer_phone || '-'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Pembayaran:</span>
                            <strong className="text-[#C29B7F] font-serif text-sm font-semibold">
                              Rp {order.subtotal?.toLocaleString('id-ID')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Metode:</span>
                            <span className="uppercase text-white font-mono font-semibold">{order.payment_method}</span>
                          </div>

                          {isRejected && order.rejection_reason && (
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[0.7rem] mt-2">
                              📌 <strong>Alasan Ditolak:</strong> "{order.rejection_reason}"
                            </div>
                          )}
                        </div>

                        {/* Payment Proof Photo Box */}
                        <div className="bg-[#0B0908] p-3 rounded-xl border border-dashed border-[#FFFFFF]/15 text-center mb-6">
                          {proofImg ? (
                            <div>
                              <div
                                className="relative h-48 w-full rounded-lg overflow-hidden mb-2 cursor-pointer group bg-[#161210]"
                                onClick={() => setSelectedImageModal(proofImg)}
                              >
                                <img
                                  src={proofImg}
                                  alt="Bukti Transfer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-[#0B0908]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono font-semibold gap-1.5">
                                  <Eye className="w-4 h-4 text-[#B82E2E]" />
                                  <span>KLIK PERBESAR</span>
                                </div>
                              </div>
                              <a
                                href={proofImg}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[0.7rem] text-[#C29B7F] hover:text-white font-mono"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>BUKA UKURAN FULL</span>
                              </a>
                            </div>
                          ) : (
                            <div className="py-6 text-[#A89F91]">
                              <AlertCircle className="w-6 h-6 text-[#B82E2E] mx-auto mb-1.5" />
                              <span className="text-xs font-mono">Foto bukti bayar tidak terlampir</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApprovePayment(order.id)}
                          disabled={isPaid}
                          className={`w-full py-2.5 rounded-xl text-xs font-mono tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-950/50 text-emerald-600 border border-emerald-800/40 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{isPaid ? 'LUNAS' : 'SETUJUI'}</span>
                        </button>

                        <button
                          onClick={() => setRejectingOrder(order)}
                          className="w-full py-2.5 rounded-xl bg-[#0E0B0A] hover:bg-red-950 border border-red-500/40 text-red-400 text-xs font-mono tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>TOLAK</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MENU CATALOG CRUD */}
        {activeTab === 'menu' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Katalog Menu QR Order</h2>
                <p className="text-xs text-[#A89F91]">Tambah, edit, hapus item menu dan kelola ketersediaan stok.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllMenu}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0B0908] hover:bg-red-950 border border-red-500/40 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Kosongkan Semua Katalog Menu"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>HAPUS SEMUA MENU</span>
                </button>
                <button
                  onClick={() => {
                    setEditingMenu(null);
                    setMenuName('');
                    setMenuPrice('');
                    setMenuDesc('');
                    setIsAddMenuOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>TAMBAH MENU BARU</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItemsState.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-[#120F0D] border border-[#FFFFFF]/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0B0908] border border-[#FFFFFF]/10 shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A89F91]">
                            <Coffee className="w-6 h-6 text-[#B82E2E]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="px-2 py-0.5 rounded bg-[#B82E2E]/20 text-[#C29B7F] text-[0.6rem] font-mono uppercase font-semibold border border-[#B82E2E]/30 mb-1 inline-block">
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

                  <div className="pt-3 border-t border-[#FFFFFF]/10 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingMenu(item);
                        setMenuName(item.name);
                        setMenuCategory(item.category || 'coffee');
                        setMenuPrice(item.base_price ? String(item.base_price) : '25000');
                        setMenuDesc(item.description || '');
                        setIsAddMenuOpen(true);
                      }}
                      className="p-2 rounded-lg bg-[#0B0908] hover:bg-[#FFFFFF]/10 text-white transition-colors cursor-pointer"
                      title="Edit Menu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item.id)}
                      className="p-2 rounded-lg bg-[#0B0908] hover:bg-red-950 text-red-400 transition-colors cursor-pointer"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: TABLE REGISTRY & QR STICKER */}
        {activeTab === 'tables' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-white font-light">Registry Meja &amp; Generator Stiker QR</h2>
                <p className="text-xs text-[#A89F91]">Kelola daftar meja dan cetak stiker Kode QR presisi per meja.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllTables}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0B0908] hover:bg-red-950 border border-red-500/40 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Kosongkan Semua Registry Meja"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>HAPUS SEMUA MEJA</span>
                </button>
                <button
                  onClick={() => {
                    setEditingTable(null);
                    setTableCodeInput('');
                    setTableNameInput('');
                    setIsAddTableOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>TAMBAH MEJA BARU</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tablesState.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-[#120F0D] border border-[#FFFFFF]/10 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl text-white font-normal mb-1">{t.name}</h3>
                    <span className="text-[0.65rem] font-mono uppercase text-[#A89F91] block mb-4">
                      KODE: {t.code} • AREA: {t.area || 'Indoor AC'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#FFFFFF]/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingQrTable(t)}
                      className="px-3 py-1.5 rounded-xl bg-[#B82E2E]/20 hover:bg-[#B82E2E] border border-[#B82E2E]/40 text-[#C29B7F] hover:text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>STIKER QR</span>
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
                        className="p-2 rounded-lg bg-[#0B0908] hover:bg-[#FFFFFF]/10 text-white transition-colors cursor-pointer"
                        title="Edit Meja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id)}
                        className="p-2 rounded-lg bg-[#0B0908] hover:bg-red-950 text-red-400 transition-colors cursor-pointer"
                        title="Hapus Meja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* MODAL 1: REJECTION REASON & WHATSAPP DEEP LINK */}
      <AnimatePresence>
        {rejectingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingOrder(null)}
              className="fixed inset-0 bg-[#0B0908]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#120F0D] border border-red-500/40 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFFFFF]/10">
                <div className="flex items-center gap-2 text-red-400 font-serif text-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>Tolak Pembayaran #{rejectingOrder.order_number}</span>
                </div>
                <button onClick={() => setRejectingOrder(null)} className="text-[#A89F91] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-2">
                    PILIH ALASAN PENOLAKAN:
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
                            : 'bg-[#0B0908] border-[#FFFFFF]/10 text-[#A89F91] hover:text-white'
                        }`}
                      >
                        {reason === 'Custom' ? '✍️ Tulis Alasan Khusus Lainnya...' : `📌 ${reason}`}
                      </button>
                    ))}
                  </div>
                </div>

                {rejectionReason === 'Custom' && (
                  <div>
                    <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">
                      Tulis Alasan Khusus:
                    </label>
                    <textarea
                      rows={3}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="misal: Foto bukti transfer terpotong, harap kirim ulang yang lengkap..."
                      className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmRejection}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>SIMPAN &amp; BUKAH CHAT WHATSAPP</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: PRINTABLE QR STICKER */}
      <AnimatePresence>
        {viewingQrTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingQrTable(null)}
              className="fixed inset-0 bg-[#0B0908]/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full max-w-md bg-[#120F0D] border border-[#B82E2E]/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl"
            >
              <button onClick={() => setViewingQrTable(null)} className="absolute top-4 right-4 text-[#A89F91] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className="text-[0.62rem] font-mono tracking-widest uppercase font-semibold text-[#C29B7F] block">
                  KOPIMAGE CRAFTSMAN STICKER
                </span>
                <h3 className="font-serif text-2xl font-normal text-white">{viewingQrTable.name}</h3>
                <span className="text-xs text-[#A89F91]">Kode: {viewingQrTable.code} • Area: {viewingQrTable.area}</span>
              </div>

              {/* QR Vector Box */}
              <div className="bg-white p-6 rounded-2xl inline-block border-4 border-[#B82E2E] shadow-2xl mb-6 my-2">
                <QRCodeSVG
                  value={`https://kopimage.vercel.app/?table=${viewingQrTable.code}`}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0B0908"
                  level="H"
                />
                <span className="font-mono text-[0.6rem] tracking-widest uppercase text-black font-bold block mt-3">
                  SCAN TO ORDER • MEJA {viewingQrTable.code}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://kopimage.vercel.app/?table=${viewingQrTable.code}`);
                    alert('Link QR Meja berhasil disalin!');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#0B0908] hover:bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-[#C29B7F]" />
                  <span>SALIN LINK</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
              className="fixed inset-0 bg-[#0B0908]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#120F0D] border border-[#B82E2E]/40 rounded-3xl p-6 shadow-2xl"
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
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Kode Meja (misal: 13)</label>
                  <input
                    type="text"
                    required
                    placeholder="13"
                    value={tableCodeInput}
                    onChange={(e) => setTableCodeInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Nama Meja (misal: MEJA 13)</label>
                  <input
                    type="text"
                    placeholder="MEJA 13"
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Area Lokasi Kedai</label>
                  <select
                    value={tableAreaInput}
                    onChange={(e) => setTableAreaInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white outline-none focus:border-[#B82E2E]"
                  >
                    <option value="Indoor AC">Indoor AC</option>
                    <option value="Outdoor Teras">Outdoor Teras</option>
                    <option value="VIP Bar">VIP Bar</option>
                    <option value="Soreang Garden">Soreang Garden</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
                >
                  SIMPAN DATA MEJA
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
              className="fixed inset-0 bg-[#0B0908]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#120F0D] border border-[#B82E2E]/40 rounded-3xl p-6 shadow-2xl my-auto text-white"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FFFFFF]/10">
                <h3 className="font-serif text-lg text-white">
                  {editingMenu ? 'Edit Menu Katalog QR' : 'Tambah Menu Baru'}
                </h3>
                <button onClick={() => setIsAddMenuOpen(false)} className="text-[#A89F91] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-4">
                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Nama Menu *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Es Kopi Susu Signature"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Kategori</label>
                    <select
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white outline-none focus:border-[#B82E2E]"
                    >
                      <option value="coffee">KOPI RACIKAN</option>
                      <option value="non-coffee">NON-COFFEE &amp; TEA</option>
                      <option value="main-course">MAKANAN &amp; MIE</option>
                      <option value="cemilan-asin">CEMILAN ASIN</option>
                      <option value="cemilan-manis">CEMILAN MANIS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Harga (Rp) *</label>
                    <input
                      type="text"
                      required
                      placeholder="25000"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">
                    FOTO MENU (PILIH GAMBAR ATAU UPLOAD)
                  </label>

                  {/* 1. Direct File Upload Button */}
                  <div className="mb-3 p-3 rounded-2xl bg-[#0B0908] border border-dashed border-[#B82E2E]/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#161210] border border-[#FFFFFF]/10 flex items-center justify-center overflow-hidden shrink-0">
                        {menuImg ? (
                          <img src={menuImg} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#A89F91]" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-white font-semibold block">Upload Foto dari Perangkat</span>
                        <span className="text-[0.65rem] text-[#A89F91]">Pilih file JPG/PNG dari Komputer atau HP</span>
                      </div>
                    </div>
                    <label className="px-3 py-2 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-[0.7rem] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                      <span>PILIH FILE</span>
                      <input type="file" accept="image/*" onChange={handleMenuImageFileSelect} className="hidden" />
                    </label>
                  </div>

                  {/* 2. Visual Preset Selector */}
                  <div className="mb-3">
                    <span className="text-[0.6rem] font-mono text-[#A89F91] block mb-1.5">Atau Pilih dari Preset Foto KOPIMAGE:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '☕ Kopi', url: '/images/kopimage_hero_atmosphere_1786480906850.png' },
                        { label: '🍵 Thai Tea', url: '/images/Moments-Top coffe.png' },
                        { label: '🍝 Makanan', url: '/images/Moments-Bukber bareng teman-teman lebih asyikkk.png' },
                        { label: '🥐 Cemilan', url: '/images/Moments-Weekend perfect with coffe in hand.png' },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setMenuImg(p.url)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            menuImg === p.url
                              ? 'bg-[#B82E2E]/20 border-[#B82E2E] text-white'
                              : 'bg-[#0B0908] border-[#FFFFFF]/10 text-[#A89F91] hover:border-[#C29B7F]'
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-full h-10 object-cover rounded-lg" />
                          <span className="text-[0.6rem] font-mono font-semibold">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Link URL Input (Optional) */}
                  <div>
                    <span className="text-[0.6rem] font-mono text-[#A89F91] block mb-1">Atau Paste Link URL Gambar (Opsional):</span>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={menuImg}
                      onChange={(e) => setMenuImg(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.65rem] font-mono uppercase font-semibold text-[#A89F91] block mb-1">Deskripsi Menu</label>
                  <textarea
                    rows={3}
                    placeholder="Racikan khas berkualitas disajikan hangat di KOPIMAGE."
                    value={menuDesc}
                    onChange={(e) => setMenuDesc(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0908] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
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
              className="fixed inset-0 bg-[#0B0908]/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 max-w-3xl max-h-[85vh] p-2 bg-[#120F0D] border border-[#B82E2E]/40 rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#0B0908]/80 text-white hover:bg-[#B82E2E] transition-all cursor-pointer"
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
