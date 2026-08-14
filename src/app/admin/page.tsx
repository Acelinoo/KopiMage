'use client';

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
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
  Upload as ImageIcon,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
          ? '/images/kopimage_hero_atmosphere_1786480906850.webp'
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
        `Silakan unggah ulang foto bukti transfer yang jelas melalui link pesananmu atau hubungi kasir kami di kedai. Terima kasih!`
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

  // Approve Cancellation Handler (Admin approves customer's cancellation request)
  const handleApproveCancellation = async (orderId: string) => {
    try {
      // Optimistic UI update
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: 'CANCELLED' } : o)));

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: 'CANCELLED',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyetujui pembatalan.');
      }

      fetchAdminOrders(false);
    } catch (err) {
      console.error('Approve cancellation error:', err);
      alert('Gagal menyetujui pembatalan. Silakan coba lagi.');
      fetchAdminOrders(false);
    }
  };

  // Reject Cancellation Handler (Admin rejects customer's cancellation request, restores order)
  const handleRejectCancellation = async (orderId: string) => {
    try {
      // Optimistic UI update - restore to PREPARING
      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, order_status: 'PREPARING', cancellation_reason: null }
            : o
        )
      );

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: 'PREPARING',
          cancellation_reason: null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menolak pembatalan.');
      }

      fetchAdminOrders(false);
    } catch (err) {
      console.error('Reject cancellation error:', err);
      alert('Gagal menolak pembatalan. Silakan coba lagi.');
      fetchAdminOrders(false);
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
        image: menuImg || editingMenu?.image || '/images/kopimage_hero_atmosphere_1786480906850.webp',
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
  const cancellationRequestedCount = ordersList.filter((o) => o.order_status === 'CANCELLATION_REQUESTED').length;
  const totalOrdersCount = ordersList.length;

  return (
    <main
      style={{
        background: isDark ? '#0E0B0A' : '#9E1F1F',
        color: isDark ? '#F7F4EF' : '#FFFFFF',
        minHeight: '100vh',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
      className="font-sans pb-20 selection:bg-[#B82E2E] selection:text-[#FFFFFF]"
    >
      {/* Industrial Craftsman Header */}
      <header
        style={{
          background: isDark ? '#161210' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
          boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 30px rgba(0, 0, 0, 0.12)',
        }}
        className="sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{ background: '#9E1F1F' }}
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0"
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span
                  style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                  className="text-[0.65rem] tracking-widest uppercase font-mono font-bold"
                >
                  KOPIMAGE INDUSTRIAL COMMAND
                </span>
              </div>
              <h1
                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                className="text-xl font-serif font-bold leading-tight"
              >
                Admin Operations Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle />
            <button
              onClick={() => fetchAdminOrders(true)}
              disabled={isRefreshing}
              style={{
                background: isDark ? '#0E0B0A' : '#FAF7F5',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#9E1F1F',
                color: isDark ? '#D4A373' : '#9E1F1F',
              }}
              className="p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center gap-2 text-xs font-mono font-bold"
              title="Refresh Sync Real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9E1F1F]' : ''}`} />
              <span>SYNC NOW</span>
            </button>

            {/* Industrial Navigation Tabs */}
            <div
              style={{
                background: isDark ? '#0E0B0A' : '#FAF7F5',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
              }}
              className="flex p-1 rounded-xl gap-1 overflow-x-auto max-w-full shrink-0"
            >
              <button
                onClick={() => setActiveTab('verification')}
                style={{
                  background: activeTab === 'verification' ? '#9E1F1F' : 'transparent',
                  color: activeTab === 'verification' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 font-bold"
              >
                <span>VERIFIKASI BAYAR</span>
                {verifyingCount > 0 && (
                  <span
                    style={{
                      background: activeTab === 'verification' ? '#FFFFFF' : '#9E1F1F',
                      color: activeTab === 'verification' ? '#9E1F1F' : '#FFFFFF',
                    }}
                    className="px-1.5 py-0.5 rounded-md text-[0.65rem] font-bold font-mono"
                  >
                    {verifyingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('menu')}
                style={{
                  background: activeTab === 'menu' ? '#9E1F1F' : 'transparent',
                  color: activeTab === 'menu' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer font-bold"
              >
                <span>KATALOG MENU</span>
              </button>

              <button
                onClick={() => setActiveTab('tables')}
                style={{
                  background: activeTab === 'tables' ? '#9E1F1F' : 'transparent',
                  color: activeTab === 'tables' ? '#FFFFFF' : (isDark ? '#A89F91' : '#555555'),
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer font-bold"
              >
                <span>MEJA QR</span>
              </button>

              <a
                href="/kitchen"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: isDark ? 'rgba(194, 155, 127, 0.15)' : '#FAF7F5',
                  border: isDark ? '1px solid rgba(194, 155, 127, 0.4)' : '1px solid #9E1F1F',
                  color: isDark ? '#C29B7F' : '#9E1F1F',
                }}
                className="px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 hover:opacity-80"
                title="Buka Monitor Dapur / Kitchen Display System"
              >
                <span>STASIUN DAPUR (KDS)</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* KPI Operations Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
            style={{
              background: isDark ? '#161210' : '#FFFFFF',
              border: isDark ? '1px solid rgba(184, 46, 46, 0.4)' : '1.5px solid #9E1F1F',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
            }}
            className="p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <span
                style={{ color: isDark ? '#A89F91' : '#555555' }}
                className="text-[0.65rem] tracking-widest font-mono uppercase block mb-1 font-bold"
              >
                VERIFIKASI PENDING
              </span>
              <span
                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                className="text-2xl font-serif font-bold"
              >
                {verifyingCount} Pesanan
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          {/* Cancellation Requested KPI */}
          {cancellationRequestedCount > 0 && (
            <div
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: '1.5px solid #E67E22',
                boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
              }}
              className="p-4 rounded-2xl flex items-center justify-between"
            >
              <div>
                <span
                  style={{ color: isDark ? '#A89F91' : '#555555' }}
                  className="text-[0.65rem] tracking-widest font-mono uppercase block mb-1 font-bold"
                >
                  PERMINTAAN BATAL
                </span>
                <span className="text-2xl font-serif font-bold text-orange-500">
                  {cancellationRequestedCount} Pesanan
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          )}

          <div
            style={{
              background: isDark ? '#161210' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
            }}
            className="p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <span
                style={{ color: isDark ? '#A89F91' : '#555555' }}
                className="text-[0.65rem] tracking-widest font-mono uppercase block mb-1 font-bold"
              >
                TERVERIFIKASI LUNAS
              </span>
              <span className="text-2xl font-serif font-bold text-emerald-500">
                {paidCount} Transaksi
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div
            style={{
              background: isDark ? '#161210' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
            }}
            className="p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <span
                style={{ color: isDark ? '#A89F91' : '#555555' }}
                className="text-[0.65rem] tracking-widest font-mono uppercase block mb-1 font-bold"
              >
                KATALOG MENU QR
              </span>
              <span
                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                className="text-2xl font-serif font-bold"
              >
                {menuItemsState.length} Item
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-[#9E1F1F]" />
            </div>
          </div>

          <div
            style={{
              background: isDark ? '#161210' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
            }}
            className="p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <span
                style={{ color: isDark ? '#A89F91' : '#555555' }}
                className="text-[0.65rem] tracking-widest font-mono uppercase block mb-1 font-bold"
              >
                TOTAL MEJA AKTIF
              </span>
              <span
                style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                className="text-2xl font-serif font-bold"
              >
                {tablesState.length} Meja
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#C29B7F]/15 border border-[#C29B7F]/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#9E1F1F]" />
            </div>
          </div>
        </div>

        {/* TAB 1: VERIFICATION OPERATIONS CONSOLE */}
        {activeTab === 'verification' && (
          <section>
            {/* Filter & Search Bar */}
            <div
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
                boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
              }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 rounded-2xl"
            >
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span
                  style={{ color: isDark ? '#A89F91' : '#555555' }}
                  className="text-xs font-mono mr-1 flex items-center gap-1 font-bold"
                >
                  <Filter className="w-3.5 h-3.5 text-[#9E1F1F]" /> FILTER:
                </span>
                {(['VERIFYING', 'PAID', 'REJECTED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? '#9E1F1F' : (isDark ? '#0E0B0A' : '#FAF7F5'),
                      border: statusFilter === st ? '1px solid #9E1F1F' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F'),
                      color: statusFilter === st ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 font-bold"
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
                    <span
                      style={{
                        background: statusFilter === st ? 'rgba(255, 255, 255, 0.25)' : (isDark ? 'rgba(0, 0, 0, 0.4)' : '#E8DFD8'),
                        color: statusFilter === st ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#1A1A1A'),
                      }}
                      className="px-1.5 py-0.2 rounded-md text-[0.65rem] font-bold"
                    >
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
                <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari No. Order, Nama, WA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                />
              </div>
            </div>

            {loading ? (
              <div
                style={{ color: isDark ? '#A89F91' : '#FFFFFF' }}
                className="flex flex-col items-center justify-center gap-3 py-24"
              >
                <RefreshCw className="w-6 h-6 animate-spin text-white" />
                <span className="text-xs font-mono tracking-widest uppercase font-bold">
                  Mengambil data transaksi real-time...
                </span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div
                style={{
                  background: isDark ? '#161210' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(39, 174, 96, 0.3)' : '1.5px solid #27AE60',
                }}
                className="p-12 rounded-3xl text-center max-w-md mx-auto my-12 shadow-2xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3
                  style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                  className="text-lg font-serif font-bold mb-1"
                >
                  Tidak Ada Pesanan Dalam Status Ini
                </h3>
                <p
                  style={{ color: isDark ? '#A89F91' : '#555555' }}
                  className="text-xs"
                >
                  Semua bukti pembayaran terverifikasi atau tidak ada data yang cocok dengan pencarian.
                </p>
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
                      style={{
                        background: isDark
                          ? (isVerifying ? '#161210' : isPaid ? '#121613' : '#181111')
                          : '#FFFFFF',
                        border: isVerifying
                          ? (isDark ? '1px solid rgba(184, 46, 46, 0.5)' : '1.5px solid #9E1F1F')
                          : isPaid
                          ? (isDark ? '1px solid rgba(39, 174, 96, 0.3)' : '1.5px solid #27AE60')
                          : (isDark ? '1px solid rgba(231, 76, 60, 0.3)' : '1.5px solid #E74C3C'),
                        boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
                      }}
                      className="p-6 rounded-2xl transition-all flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        {/* Order Header Card */}
                        <div
                          style={{
                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                          }}
                          className="flex items-center justify-between mb-4 pb-3"
                        >
                          <div>
                            <span
                              style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                              className="font-serif text-lg font-bold block leading-none mb-1"
                            >
                              {order.order_display_number ? `${order.order_display_number} (${order.order_number})` : order.order_number}
                            </span>
                            <span
                              style={{ color: isDark ? '#C29B7F' : '#555555' }}
                              className="text-[0.72rem] font-mono font-semibold"
                            >
                              {order.mode === 'dine-in' ? `DINE-IN • MEJA ${order.table_id || '01'}` : 'TAKEAWAY'}
                            </span>
                          </div>
                          <span
                            style={{
                              borderTop: '1px solid currentColor',
                              borderBottom: '1px solid currentColor',
                              color: isVerifying ? '#E67E22' : isPaid ? '#27AE60' : '#E74C3C',
                            }}
                            className="px-1 py-0.5 text-[0.68rem] font-mono tracking-widest uppercase font-bold"
                          >
                            {order.payment_status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div
                          style={{ color: isDark ? '#A89F91' : '#555555' }}
                          className="space-y-2 text-xs mb-5 font-mono"
                        >
                          <div className="flex justify-between">
                            <span>Pemesan:</span>
                            <strong style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="font-serif text-sm">
                              {order.customer_name}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>No. WhatsApp:</span>
                            <strong className="text-emerald-500 font-mono font-bold">
                              {order.customer_phone || '-'}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Pembayaran:</span>
                            <strong
                              style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                              className="font-serif text-sm font-bold"
                            >
                              Rp {order.subtotal?.toLocaleString('id-ID')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Metode:</span>
                            <span
                              style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                              className="uppercase font-mono font-bold"
                            >
                              {order.payment_method}
                            </span>
                          </div>

                          {isRejected && order.rejection_reason && (
                            <div
                              style={{
                                background: isDark ? 'rgba(231, 76, 60, 0.1)' : '#FDEDEC',
                                borderColor: '#E74C3C',
                                color: '#E74C3C',
                              }}
                              className="p-2.5 rounded-xl border text-[0.72rem] mt-2 font-medium"
                            >
                              <strong>Alasan Ditolak:</strong> "{order.rejection_reason}"
                            </div>
                          )}

                          {/* CANCELLATION REQUESTED BADGE */}
                          {order.order_status === 'CANCELLATION_REQUESTED' && (
                            <div
                              style={{
                                background: isDark ? 'rgba(230, 126, 34, 0.15)' : '#FFF9F4',
                                borderColor: '#E67E22',
                                color: '#E67E22',
                              }}
                              className="p-2.5 rounded-xl border text-[0.72rem] mt-2"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <strong className="font-mono uppercase tracking-wider">PEMBATALAN DIMINTA</strong>
                              </div>
                              {order.cancellation_reason && (
                                <span style={{ color: isDark ? '#F39C12' : '#C0392B' }}>
                                  Alasan: "{order.cancellation_reason}"
                                </span>
                              )}
                            </div>
                          )}

                          {/* CANCELLED STATUS BADGE */}
                          {order.order_status === 'CANCELLED' && (
                            <div
                              style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#DDD',
                                color: '#777777',
                              }}
                              className="p-2.5 rounded-xl border text-[0.72rem] mt-2"
                            >
                              <div className="flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5" />
                                <strong className="font-mono uppercase tracking-wider">PESANAN DIBATALKAN</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Payment Proof Photo Box */}
                        <div
                          style={{
                            background: isDark ? '#0B0908' : '#FAF7F5',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(158, 31, 31, 0.3)',
                          }}
                          className="p-3 rounded-xl border border-dashed text-center mb-6"
                        >
                          {proofImg ? (
                            <div>
                              <div
                                style={{ background: isDark ? '#161210' : '#FFFFFF' }}
                                className="relative h-48 w-full rounded-lg overflow-hidden mb-2 cursor-pointer group"
                                onClick={() => setSelectedImageModal(proofImg)}
                              >
                                <img
                                  src={proofImg}
                                  alt="Bukti Transfer"
                                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono font-semibold gap-1.5">
                                  <Eye className="w-4 h-4 text-white" />
                                  <span>KLIK PERBESAR</span>
                                </div>
                              </div>
                              <a
                                href={proofImg}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                className="inline-flex items-center gap-1 text-[0.72rem] hover:underline font-mono font-bold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>BUKA UKURAN FULL</span>
                              </a>
                            </div>
                          ) : (
                            <div style={{ color: isDark ? '#A89F91' : '#777777' }} className="py-6">
                              <AlertCircle className="w-6 h-6 text-[#9E1F1F] mx-auto mb-1.5" />
                              <span className="text-xs font-mono">Foto bukti bayar tidak terlampir</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        {order.order_status === 'CANCELLATION_REQUESTED' ? (
                          <>
                            <button
                              onClick={() => handleApproveCancellation(order.id)}
                              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>SETUJUI BATAL</span>
                            </button>
                            <button
                              onClick={() => handleRejectCancellation(order.id)}
                              style={{
                                background: isDark ? '#0E0B0A' : '#FAF7F5',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#9E1F1F',
                                color: isDark ? '#A89F91' : '#1A1A1A',
                              }}
                              className="w-full py-2.5 rounded-xl border text-xs font-mono tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              <span>TOLAK BATAL</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprovePayment(order.id)}
                              disabled={isPaid}
                              style={{
                                background: isPaid ? (isDark ? 'rgba(39, 174, 96, 0.2)' : '#E8F6ED') : '#27AE60',
                                color: isPaid ? '#27AE60' : '#FFFFFF',
                                border: isPaid ? '1px solid #27AE60' : 'none',
                              }}
                              className={`w-full py-2.5 rounded-xl text-xs font-mono tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                                isPaid ? 'cursor-not-allowed' : 'hover:opacity-90'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              <span>{isPaid ? 'LUNAS' : 'TANDAI LUNAS'}</span>
                            </button>

                            <button
                              onClick={() => setRejectingOrder(order)}
                              style={{
                                background: isDark ? '#0E0B0A' : '#FAF7F5',
                                borderColor: '#E74C3C',
                                color: '#E74C3C',
                              }}
                              className="w-full py-2.5 rounded-xl border hover:bg-red-50 text-xs font-mono tracking-wider uppercase font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              <span>TOLAK</span>
                            </button>
                          </>
                        )}
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
                <h2 className="text-xl font-serif text-white font-bold">Katalog Menu QR Order</h2>
                <p className="text-xs text-white/80 font-mono">Tambah, edit, hapus item menu dan kelola ketersediaan stok.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllMenu}
                  style={{
                    background: isDark ? '#0B0908' : 'rgba(0,0,0,0.2)',
                    borderColor: isDark ? 'rgba(231, 76, 60, 0.4)' : 'rgba(255,255,255,0.4)',
                    color: isDark ? '#E74C3C' : '#FFFFFF',
                  }}
                  className="px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
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
                  style={{
                    background: isDark ? '#B82E2E' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#9E1F1F',
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>TAMBAH MENU BARU</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItemsState.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: isDark ? '#161210' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
                    boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
                  }}
                  className="p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        style={{
                          background: isDark ? '#0B0908' : '#FAF7F5',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
                        }}
                        className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0"
                      >
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Coffee className="w-6 h-6 text-[#9E1F1F]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span
                          style={{
                            borderTop: '1px solid currentColor',
                            borderBottom: '1px solid currentColor',
                            color: isDark ? '#D4A373' : '#9E1F1F',
                          }}
                          className="px-1.5 py-0.5 text-[0.62rem] font-mono uppercase font-bold mb-1 inline-block"
                        >
                          {item.category || 'KOPI'}
                        </span>
                        <h4
                          style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                          className="font-serif text-base font-bold"
                        >
                          {item.name}
                        </h4>
                        <span
                          style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                          className="font-mono text-sm font-bold block"
                        >
                          {item.price || `Rp ${item.base_price?.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-xs line-clamp-2 mb-4 font-light leading-relaxed"
                    >
                      {item.description || 'Racikan khas berkualitas KOPIMAGE.'}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                    }}
                    className="pt-3 flex items-center justify-end gap-2"
                  >
                    <button
                      onClick={() => {
                        setEditingMenu(item);
                        setMenuName(item.name);
                        setMenuCategory(item.category || 'coffee');
                        setMenuPrice(item.base_price ? String(item.base_price) : '25000');
                        setMenuDesc(item.description || '');
                        setIsAddMenuOpen(true);
                      }}
                      style={{
                        background: isDark ? '#0B0908' : '#FAF7F5',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                      className="p-2 rounded-lg transition-colors cursor-pointer"
                      title="Edit Menu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(item.id)}
                      style={{
                        background: isDark ? '#0B0908' : '#FAF7F5',
                        border: '1px solid #E74C3C',
                        color: '#E74C3C',
                      }}
                      className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-red-50"
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
                <h2 className="text-xl font-serif text-white font-bold">Registry Meja &amp; Generator Stiker QR</h2>
                <p className="text-xs text-white/80 font-mono">Kelola daftar meja dan cetak stiker Kode QR presisi per meja.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllTables}
                  style={{
                    background: isDark ? '#0B0908' : 'rgba(0,0,0,0.2)',
                    borderColor: isDark ? 'rgba(231, 76, 60, 0.4)' : 'rgba(255,255,255,0.4)',
                    color: isDark ? '#E74C3C' : '#FFFFFF',
                  }}
                  className="px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
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
                  style={{
                    background: isDark ? '#B82E2E' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#9E1F1F',
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>TAMBAH MEJA BARU</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tablesState.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: isDark ? '#161210' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #9E1F1F',
                    boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.6)' : '0 8px 25px rgba(0, 0, 0, 0.1)',
                  }}
                  className="p-5 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <h3
                      style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                      className="font-serif text-xl font-bold mb-1"
                    >
                      {t.name}
                    </h3>
                    <span
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.68rem] font-mono uppercase block mb-4 font-semibold"
                    >
                      KODE: {t.code} • AREA: {t.area || 'Indoor AC'}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                    }}
                    className="pt-3 flex items-center justify-between gap-2"
                  >
                    <button
                      onClick={() => setViewingQrTable(t)}
                      style={{
                        background: isDark ? 'rgba(184, 46, 46, 0.2)' : '#F5EBEB',
                        border: isDark ? '1px solid rgba(184, 46, 46, 0.4)' : '1px solid #9E1F1F',
                        color: isDark ? '#D4A373' : '#9E1F1F',
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                        style={{
                          background: isDark ? '#0B0908' : '#FAF7F5',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
                          color: isDark ? '#FFFFFF' : '#1A1A1A',
                        }}
                        className="p-2 rounded-lg transition-colors cursor-pointer"
                        title="Edit Meja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id)}
                        style={{
                          background: isDark ? '#0B0908' : '#FAF7F5',
                          border: '1px solid #E74C3C',
                          color: '#E74C3C',
                        }}
                        className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-red-50"
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: '2px solid #E74C3C',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }}
              className="relative z-10 w-full max-w-lg rounded-3xl p-6 shadow-2xl"
            >
              <div
                style={{
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(231, 76, 60, 0.2)',
                }}
                className="flex items-center justify-between mb-4 pb-3"
              >
                <div className="flex items-center gap-2 text-red-500 font-serif text-lg font-bold">
                  <AlertCircle className="w-5 h-5" />
                  <span>Tolak Pembayaran #{rejectingOrder.order_number}</span>
                </div>
                <button
                  onClick={() => setRejectingOrder(null)}
                  style={{ color: isDark ? '#A89F91' : '#1A1A1A' }}
                  className="cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-2"
                  >
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
                        style={{
                          background: rejectionReason === reason
                            ? (isDark ? 'rgba(184, 46, 46, 0.25)' : '#FDF2F2')
                            : (isDark ? '#0E0B0A' : '#FAF7F5'),
                          borderColor: rejectionReason === reason ? '#9E1F1F' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F'),
                          color: rejectionReason === reason ? '#9E1F1F' : (isDark ? '#A89F91' : '#1A1A1A'),
                          fontWeight: rejectionReason === reason ? 700 : 500,
                        }}
                        className="w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer"
                      >
                        {reason === 'Custom' ? 'Tulis Alasan Khusus Lainnya...' : reason}
                      </button>
                    ))}
                  </div>
                </div>

                {rejectionReason === 'Custom' && (
                  <div>
                    <label
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                    >
                      Tulis Alasan Khusus:
                    </label>
                    <textarea
                      rows={3}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="misal: Foto bukti transfer terpotong, harap kirim ulang yang lengkap..."
                      style={{
                        background: isDark ? '#0E0B0A' : '#FAF7F5',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                      className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmRejection}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>SIMPAN &amp; BUKA CHAT WHATSAPP</span>
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
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '2px solid #9E1F1F',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }}
              className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl"
            >
              <button
                onClick={() => setViewingQrTable(null)}
                style={{ color: isDark ? '#A89F91' : '#1A1A1A' }}
                className="absolute top-4 right-4 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span
                  style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                  className="text-[0.65rem] font-mono tracking-widest uppercase font-bold block"
                >
                  KOPIMAGE CRAFTSMAN STICKER
                </span>
                <h3
                  style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                  className="font-serif text-2xl font-bold"
                >
                  {viewingQrTable.name}
                </h3>
                <span
                  style={{ color: isDark ? '#A89F91' : '#555555' }}
                  className="text-xs font-mono"
                >
                  Kode: {viewingQrTable.code} • Area: {viewingQrTable.area}
                </span>
              </div>

              {/* QR Vector Box */}
              <div className="bg-white p-6 rounded-2xl inline-block border-4 border-[#9E1F1F] shadow-2xl mb-6 my-2">
                <QRCodeSVG
                  value={`https://kopimage.vercel.app/?table=${viewingQrTable.code}`}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0B0908"
                  level="H"
                />
                <span className="font-mono text-[0.62rem] tracking-widest uppercase text-black font-bold block mt-3">
                  SCAN TO ORDER • MEJA {viewingQrTable.code}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://kopimage.vercel.app/?table=${viewingQrTable.code}`);
                    alert('Link QR Meja berhasil disalin!');
                  }}
                  style={{
                    background: isDark ? '#0B0908' : '#FAF7F5',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #9E1F1F',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-[#9E1F1F]" />
                  <span>SALIN LINK</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 rounded-xl bg-[#9E1F1F] hover:opacity-90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '2px solid #9E1F1F',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }}
              className="relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div
                style={{
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                }}
                className="flex items-center justify-between mb-4 pb-3"
              >
                <h3
                  style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                  className="font-serif text-lg font-bold"
                >
                  {editingTable ? 'Edit Data Meja' : 'Tambah Meja Baru'}
                </h3>
                <button
                  onClick={() => setIsAddTableOpen(false)}
                  style={{ color: isDark ? '#A89F91' : '#1A1A1A' }}
                  className="cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTable} className="space-y-4">
                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    Kode Meja (misal: 13)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="13"
                    value={tableCodeInput}
                    onChange={(e) => setTableCodeInput(e.target.value)}
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                  />
                </div>

                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    Nama Meja (misal: MEJA 13)
                  </label>
                  <input
                    type="text"
                    placeholder="MEJA 13"
                    value={tableNameInput}
                    onChange={(e) => setTableNameInput(e.target.value)}
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                  />
                </div>

                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    Area Lokasi Kedai
                  </label>
                  <select
                    value={tableAreaInput}
                    onChange={(e) => setTableAreaInput(e.target.value)}
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full p-3 rounded-xl text-xs outline-none focus:border-[#9E1F1F]"
                  >
                    <option value="Indoor AC">Indoor AC</option>
                    <option value="Outdoor Teras">Outdoor Teras</option>
                    <option value="VIP Bar">VIP Bar</option>
                    <option value="Soreang Garden">Soreang Garden</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#9E1F1F] hover:opacity-90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '2px solid #9E1F1F',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }}
              className="relative z-10 w-full max-w-lg rounded-3xl p-6 shadow-2xl my-auto"
            >
              <div
                style={{
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(158, 31, 31, 0.15)',
                }}
                className="flex items-center justify-between mb-4 pb-3"
              >
                <h3
                  style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                  className="font-serif text-lg font-bold"
                >
                  {editingMenu ? 'Edit Menu Katalog QR' : 'Tambah Menu Baru'}
                </h3>
                <button
                  onClick={() => setIsAddMenuOpen(false)}
                  style={{ color: isDark ? '#A89F91' : '#1A1A1A' }}
                  className="cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-4">
                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    Nama Menu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Es Kopi Susu Signature"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                    >
                      Kategori
                    </label>
                    <select
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      style={{
                        background: isDark ? '#0B0908' : '#FAF7F5',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                      className="w-full p-3 rounded-xl text-xs outline-none focus:border-[#9E1F1F]"
                    >
                      <option value="coffee">KOPI RACIKAN</option>
                      <option value="non-coffee">NON-COFFEE &amp; TEA</option>
                      <option value="main-course">MAKANAN &amp; MIE</option>
                      <option value="cemilan-asin">CEMILAN ASIN</option>
                      <option value="cemilan-manis">CEMILAN MANIS</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                    >
                      Harga (Rp) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="25000"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      style={{
                        background: isDark ? '#0B0908' : '#FAF7F5',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                      className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    FOTO MENU (PILIH GAMBAR ATAU UPLOAD)
                  </label>

                  {/* 1. Direct File Upload Button */}
                  <div
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      borderColor: isDark ? 'rgba(184, 46, 46, 0.4)' : '#9E1F1F',
                    }}
                    className="mb-3 p-3 rounded-2xl border border-dashed flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          background: isDark ? '#161210' : '#FFFFFF',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
                        }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                      >
                        {menuImg ? (
                          <img src={menuImg} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#9E1F1F]" />
                        )}
                      </div>
                      <div>
                        <span
                          style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                          className="text-xs font-bold block"
                        >
                          Upload Foto dari Perangkat
                        </span>
                        <span
                          style={{ color: isDark ? '#A89F91' : '#777777' }}
                          className="text-[0.65rem]"
                        >
                          Pilih file JPG/PNG dari Komputer atau HP
                        </span>
                      </div>
                    </div>
                    <label className="px-3 py-2 rounded-xl bg-[#9E1F1F] hover:opacity-90 text-white text-[0.7rem] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                      <span>PILIH FILE</span>
                      <input type="file" accept="image/*" onChange={handleMenuImageFileSelect} className="hidden" />
                    </label>
                  </div>

                  {/* 2. Visual Preset Selector */}
                  <div className="mb-3">
                    <span
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.65rem] font-mono font-bold block mb-1.5"
                    >
                      Atau Pilih dari Preset Foto KOPIMAGE:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kopi', url: '/images/kopimage_hero_atmosphere_1786480906850.webp' },
                        { label: 'Thai Tea', url: '/images/Moments-Top coffe.webp' },
                        { label: 'Makanan', url: '/images/Moments-Bukber bareng teman-teman lebih asyikkk.webp' },
                        { label: 'Cemilan', url: '/images/Moments-Weekend perfect with coffe in hand.webp' },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setMenuImg(p.url)}
                          style={{
                            background: menuImg === p.url
                              ? (isDark ? 'rgba(184, 46, 46, 0.25)' : '#FDF2F2')
                              : (isDark ? '#0B0908' : '#FAF7F5'),
                            borderColor: menuImg === p.url ? '#9E1F1F' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F'),
                            color: menuImg === p.url ? '#9E1F1F' : (isDark ? '#A89F91' : '#1A1A1A'),
                          }}
                          className="p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer"
                        >
                          <img src={p.url} alt={p.label} className="w-full h-10 object-cover rounded-lg" />
                          <span className="text-[0.62rem] font-mono font-bold">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Link URL Input (Optional) */}
                  <div>
                    <span
                      style={{ color: isDark ? '#A89F91' : '#555555' }}
                      className="text-[0.65rem] font-mono font-bold block mb-1"
                    >
                      Atau Paste Link URL Gambar (Opsional):
                    </span>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={menuImg}
                      onChange={(e) => setMenuImg(e.target.value)}
                      style={{
                        background: isDark ? '#0B0908' : '#FAF7F5',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                      className="w-full p-2.5 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{ color: isDark ? '#A89F91' : '#555555' }}
                    className="text-[0.68rem] font-mono uppercase font-bold block mb-1"
                  >
                    Deskripsi Menu
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Racikan khas berkualitas disajikan hangat di KOPIMAGE."
                    value={menuDesc}
                    onChange={(e) => setMenuDesc(e.target.value)}
                    style={{
                      background: isDark ? '#0B0908' : '#FAF7F5',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full p-3 rounded-xl text-xs focus:outline-none focus:border-[#9E1F1F]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#9E1F1F] hover:opacity-90 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer mt-4"
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
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: isDark ? '#161210' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '2px solid #9E1F1F',
              }}
              className="relative z-10 max-w-3xl max-h-[85vh] p-2 rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedImageModal(null)}
                style={{ background: '#9E1F1F', color: '#FFFFFF' }}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-md"
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
