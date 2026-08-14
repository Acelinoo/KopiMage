'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { OrderMode, PaymentMethod } from '@/types/order';
import { compressImageFile } from '@/lib/imageCompressor';
import { isSameTable, isActiveCustomerOrder, isCompletedOrCancelledOrder } from '@/lib/tableUtils';
import { X, CheckCircle, Upload, QrCode, CreditCard, Store, UtensilsCrossed, ShoppingBag, AlertCircle, Loader2, Coffee, Clock, ShieldCheck, RefreshCw, XCircle, Heart, Sparkles } from 'lucide-react';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onSuccess }) => {
  const { cartItems, estimatedSubtotal, clearCart, activeTableId } = useCart();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<OrderMode>(activeTableId ? 'dine-in' : 'dine-in');
  const formattedInitialTable = activeTableId ? String(activeTableId).padStart(2, '0') : '01';
  const [selectedTable, setSelectedTable] = useState<string>(formattedInitialTable);
  const [liveTables, setLiveTables] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cashier');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Single Popup Unified State: Track created order right inside this popup
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // Cancellation Flow State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Berubah pikiran / ingin ganti menu');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Auto-restore active order from LocalStorage ONLY IF cart is empty AND table_id matches AND status is ACTIVE
  useEffect(() => {
    if (typeof window !== 'undefined' && !createdOrder) {
      if (cartItems.length === 0) {
        try {
          const stored = localStorage.getItem('kopimage_active_table_order');
          if (stored) {
            const parsed = JSON.parse(stored);
            const storedTableId = parsed?.table_id || parsed?.tableNumber || parsed?.table_code;
            const currentTableId = selectedTable || activeTableId;

            // 1. Strict Table Isolation Check
            // 2. Active Customer Order Check (DO NOT restore COMPLETED / CANCELLED as active modal on page load!)
            if (parsed && parsed.id && isSameTable(storedTableId, currentTableId) && isActiveCustomerOrder(parsed)) {
              setCreatedOrder(parsed);
              setSubmissionStep(4);
            } else if (parsed && isCompletedOrCancelledOrder(parsed)) {
              // Expired completed order -> Clean localStorage
              localStorage.removeItem('kopimage_active_table_order');
            }
          }
        } catch (e) {}
      }
    }
  }, [cartItems.length, selectedTable, activeTableId]);

  // Fetch Live Tables from /api/tables & LocalStorage fallback
  useEffect(() => {
    const isCleared = typeof window !== 'undefined' && localStorage.getItem('kopimage_tables_cleared') === 'true';
    const localTables = typeof window !== 'undefined' ? localStorage.getItem('kopimage_custom_tables_v3') : null;
    const parsedLocal = localTables ? JSON.parse(localTables) : [];

    if (isCleared && parsedLocal.length === 0) {
      setLiveTables([]);
    } else {
      fetch('/api/tables')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.tables)) {
            const apiCodes = new Set(data.tables.map((t: any) => t.code || t.id));
            const merged = [...data.tables, ...parsedLocal.filter((t: any) => !apiCodes.has(t.code || t.id))];
            setLiveTables(merged);
          } else if (parsedLocal.length > 0) {
            setLiveTables(parsedLocal);
          }
        })
        .catch(() => {
          if (parsedLocal.length > 0) setLiveTables(parsedLocal);
        });
    }
  }, []);

  // Real-time Polling for Order Status Updates & 12s Auto-Dismiss for COMPLETED/CANCELLED
  useEffect(() => {
    if (!createdOrder?.id) return;

    // Auto-dismiss after 12s if status is COMPLETED or CANCELLED
    if (isCompletedOrCancelledOrder(createdOrder)) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('kopimage_active_table_order');
          } catch (e) {}
        }
        onClose();
      }, 12000);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const res = await fetch('/api/admin/orders?status=ALL');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const matched = data.orders.find((o: any) => o.id === createdOrder.id);
          if (matched) {
            setCreatedOrder(matched);
            if (typeof window !== 'undefined') {
              try {
                if (isActiveCustomerOrder(matched)) {
                  localStorage.setItem('kopimage_active_table_order', JSON.stringify(matched));
                } else if (isCompletedOrCancelledOrder(matched)) {
                  // Keep temporarily for 12s, then will auto-clear
                  localStorage.setItem('kopimage_active_table_order', JSON.stringify(matched));
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.warn('Realtime order polling warning:', err);
      } finally {
        setIsPolling(false);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [createdOrder?.id, createdOrder?.order_status, onClose]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMessage('Harap isi Nama Pemesan.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Harap isi No. WhatsApp untuk konfirmasi pesanan.');
      return;
    }

    if (mode === 'dine-in' && !selectedTable) {
      setErrorMessage('Harap pilih Nomor Meja Kedai.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSubmissionStep(1); // Step 1: Mengecek pemesanan

    try {
      let uploadedProofUrl: string | null = null;

      // Ultra-fast client-side canvas compression for payment proof
      if (proofFile && paymentMethod !== 'cashier') {
        setSubmissionStep(2); // Step 2: Mengompresi & menyiapkan bukti transfer
        try {
          uploadedProofUrl = await compressImageFile(proofFile, 800, 0.70);
        } catch (cErr) {
          console.warn('Image compressor fallback:', cErr);
        }
      } else {
        setSubmissionStep(2);
      }

      setSubmissionStep(3); // Step 3: Mengirimkan pesanan ke Admin & Dapur

      // Build order items payload
      const itemsPayload = cartItems.map((ci) => ({
        menu_item_id: ci.menuItem.id,
        quantity: ci.quantity,
        notes: ci.notes || '',
        selected_modifiers: ci.selectedModifiers.map((m) => ({
          modifierId: m.modifierId,
          modifierName: m.modifierName,
          optionId: m.optionId,
          optionLabel: m.optionLabel,
          priceDelta: m.priceDelta,
        })),
      }));

      // Call Server-Side Zero-Trust Order API (with Idempotency Key)
      const clientOrderId = crypto.randomUUID();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_order_id: clientOrderId,
          mode,
          table_id: mode === 'dine-in' ? selectedTable : null,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_method: paymentMethod,
          payment_proof_url: uploadedProofUrl,
          items: itemsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses pesanan di server.');
      }

      setCreatedOrder(data.order);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kopimage_active_table_order', JSON.stringify(data.order));
        } catch (e) {}
      }
      setSubmissionStep(4); // Step 4: Selesai -> Tampilkan Live Popup Status
      clearCart();
      onSuccess();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat checkout.');
      setSubmissionStep(0);
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // VIEW 1: ANIMASI LOADING PROSES (Mengecek, Membuat, Mengirim)
  // ----------------------------------------------------
  if (submissionStep > 0 && submissionStep < 4) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: isDark ? 'rgba(14, 11, 10, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(184, 46, 46, 0.4) 0%, rgba(212, 163, 115, 0.15) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(158, 31, 31, 0.2) 0%, rgba(158, 31, 31, 0.05) 70%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isDark ? '1px solid rgba(212, 163, 115, 0.4)' : '1.5px solid #9E1F1F',
              boxShadow: isDark ? '0 0 50px rgba(184, 46, 46, 0.4)' : '0 0 40px rgba(158, 31, 31, 0.15)',
            }}
          >
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} />
          </div>
        </div>

        <h3 style={{ fontFamily: 'serif', fontSize: '1.8rem', fontWeight: 700, color: isDark ? '#FFFFFF' : '#1A1A1A', marginBottom: '0.5rem' }}>
          Memproses Pesanan Anda...
        </h3>
        <p style={{ fontSize: '0.88rem', color: isDark ? '#A89F91' : '#555555', maxWidth: '420px', marginBottom: '2.5rem', lineHeight: 1.5 }}>
          Pesanan sedang diverifikasi dan diteruskan langsung ke Stasiun Dapur KopiMage.
        </p>

        {/* Steps Progress Checklist */}
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 1 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: submissionStep > 1 ? '#2ECC71' : submissionStep === 1 ? (isDark ? '#D4A373' : '#9E1F1F') : (isDark ? '#2A2421' : '#E0D8D4'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: submissionStep >= 1 ? '#FFFFFF' : '#777',
                flexShrink: 0,
              }}
            >
              {submissionStep > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 1 ? 700 : 400, color: submissionStep >= 1 ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#888' }}>
              Mengecek pemesanan & nomor meja
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 2 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: submissionStep > 2 ? '#2ECC71' : submissionStep === 2 ? (isDark ? '#D4A373' : '#9E1F1F') : (isDark ? '#2A2421' : '#E0D8D4'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: submissionStep >= 2 ? '#FFFFFF' : '#777',
                flexShrink: 0,
              }}
            >
              {submissionStep > 2 ? '✓' : '2'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 2 ? 700 : 400, color: submissionStep >= 2 ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#888' }}>
              Membuat pesanan di sistem KopiMage
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 3 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: submissionStep > 3 ? '#2ECC71' : submissionStep === 3 ? (isDark ? '#D4A373' : '#9E1F1F') : (isDark ? '#2A2421' : '#E0D8D4'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: submissionStep >= 3 ? '#FFFFFF' : '#777',
                flexShrink: 0,
              }}
            >
              {submissionStep > 3 ? '✓' : '3'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 3 ? 700 : 400, color: submissionStep >= 3 ? (isDark ? '#FFFFFF' : '#1A1A1A') : '#888' }}>
              Mengirimkan pesanan ke Admin Kasir & Dapur
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle Cancellation Request Submit
  const handleCancellationRequest = async () => {
    if (!createdOrder?.id) return;
    const finalReason = cancelReason === 'Custom' ? customCancelReason : cancelReason;
    if (!finalReason.trim()) return;

    setIsCancelling(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: createdOrder.id,
          order_status: 'CANCELLATION_REQUESTED',
          cancellation_reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengajukan pembatalan.');
      }

      // Update local state
      setCreatedOrder((prev: any) => ({
        ...prev,
        order_status: 'CANCELLATION_REQUESTED',
        cancellation_reason: finalReason,
      }));

      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kopimage_active_table_order');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.order_status = 'CANCELLATION_REQUESTED';
            parsed.cancellation_reason = finalReason;
            localStorage.setItem('kopimage_active_table_order', JSON.stringify(parsed));
          }
        } catch (e) {}
      }

      setShowCancelConfirm(false);
    } catch (err: any) {
      console.error('Cancellation request error:', err);
      alert(err.message || 'Gagal mengajukan pembatalan pesanan.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle clearing cancelled order from localStorage
  const handleClearCancelledOrder = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kopimage_active_table_order');
      } catch (e) {}
    }
    setCreatedOrder(null);
    setSubmissionStep(0);
    onClose();
  };

  // ----------------------------------------------------
  // VIEW 2: UNIFIED SINGLE POPUP REAL-TIME ORDER STATUS TRACKER
  // (Muncul Langsung di 1 Popup Tanpa Redirect Halaman!)
  // ----------------------------------------------------
  if (createdOrder) {
    const isApproved = createdOrder.payment_status === 'PAID' || createdOrder.payment_method === 'cashier';
    const isReady = createdOrder.order_status === 'READY';
    const isCompleted = createdOrder.order_status === 'COMPLETED';
    const isCancellationRequested = createdOrder.order_status === 'CANCELLATION_REQUESTED';
    const isCancelled = createdOrder.order_status === 'CANCELLED';
    const canRequestCancel = !isReady && !isCompleted && !isCancelled && !isCancellationRequested;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1050,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '24px',
            padding: '1.25rem 1.5rem',
            position: 'relative',
            background: isDark ? '#161210' : '#FFFFFF',
            border: isCancelled
              ? (isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #999')
              : isCancellationRequested
              ? (isDark ? '1px solid rgba(230, 126, 34, 0.5)' : '1.5px solid #E67E22')
              : isApproved
              ? (isDark ? '1px solid rgba(46, 204, 113, 0.5)' : '1.5px solid #2ECC71')
              : (isDark ? '1px solid rgba(212, 163, 115, 0.4)' : '1.5px solid #9E1F1F'),
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.9)' : '0 25px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header (Fixed at top - Never cut off) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F', paddingBottom: '0.85rem', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: isCancelled ? '#888' : (isDark ? '#D4A373' : '#9E1F1F'), fontWeight: 800, fontFamily: 'monospace' }}>
                  {isCancelled ? 'PESANAN DIBATALKAN' : 'STATUS PESANAN LIVE'}
                </span>
                {!isCancelled && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCancellationRequested ? '#E67E22' : isApproved ? '#2ECC71' : '#E67E22', display: 'inline-block' }} className="animate-ping" />
                )}
              </div>
              <h3 style={{ fontSize: '1.35rem', color: isCancelled ? '#888' : (isDark ? '#FFFFFF' : '#1A1A1A'), fontWeight: 800, margin: 0, fontFamily: 'serif', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                {createdOrder.order_display_number ? `${createdOrder.order_display_number} (${createdOrder.order_number})` : createdOrder.order_number}
              </h3>
              <p style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555', marginTop: '0.15rem', margin: 0, fontFamily: 'monospace' }}>
                {createdOrder.mode === 'dine-in' ? `Dine-In • MEJA ${createdOrder.table_id || '01'}` : 'Takeaway'} ({createdOrder.customer_name})
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : '#F5EBEB',
                border: isDark ? 'none' : '1px solid #9E1F1F',
                color: isDark ? '#FFF' : '#1A1A1A',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '-0.2rem',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Modal Content Body */}
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>

          {/* CANCELLED BANNER */}
          {isCancelled && (
            <div
              style={{
                padding: '1.2rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                background: isDark ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.2) 0%, rgba(50, 50, 50, 0.1) 100%)' : '#F5F5F5',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CCCCCC',
                textAlign: 'center',
              }}
            >
              <XCircle className="w-10 h-10 text-[#999] mx-auto mb-2" />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#999' : '#555', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                PESANAN TELAH DIBATALKAN
              </h4>
              <p style={{ fontSize: '0.82rem', color: isDark ? '#888' : '#666' }}>
                Pembatalan pesanan telah disetujui oleh Admin. Pesanan ini tidak lagi diproses.
              </p>
              {createdOrder.cancellation_reason && (
                <p style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#777', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Alasan: "{createdOrder.cancellation_reason}"
                </p>
              )}
            </div>
          )}

          {/* CANCELLATION REQUESTED BANNER */}
          {isCancellationRequested && (
            <div
              style={{
                padding: '1.2rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                background: isDark ? 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)' : '#FFF9F4',
                border: '1.5px solid #E67E22',
                textAlign: 'center',
              }}
            >
              <Clock className="w-9 h-9 text-[#E67E22] mx-auto mb-2 animate-pulse" />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#E67E22', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                MENUNGGU PERSETUJUAN PEMBATALAN
              </h4>
              <p style={{ fontSize: '0.82rem', color: isDark ? '#F7F4EF' : '#333333' }}>
                Permintaan pembatalan sedang ditinjau oleh Admin KOPIMAGE.
              </p>
              {createdOrder.cancellation_reason && (
                <p style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#666666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Alasan: "{createdOrder.cancellation_reason}"
                </p>
              )}
            </div>
          )}

          {/* REALTIME APPROVAL ANIMATION BANNER */}
          {!isCancelled && !isCancellationRequested && (
            <div
              style={{
                padding: '1.2rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                background: isCompleted
                  ? (isDark ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.25) 0%, rgba(212, 163, 115, 0.2) 100%)' : '#F2FAF5')
                  : isReady
                  ? (isDark ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.25) 0%, rgba(39, 174, 96, 0.1) 100%)' : '#F2FAF5')
                  : isApproved
                  ? (isDark ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.18) 0%, rgba(212, 163, 115, 0.1) 100%)' : '#F2FAF5')
                  : (isDark ? 'linear-gradient(135deg, rgba(212, 163, 115, 0.2) 0%, rgba(184, 46, 46, 0.1) 100%)' : '#FAF7F5'),
                border: isCompleted || isReady || isApproved
                  ? '1.5px solid #2ECC71'
                  : (isDark ? '1px solid rgba(212, 163, 115, 0.5)' : '1.5px solid #9E1F1F'),
                textAlign: 'center',
              }}
            >
              {isCompleted ? (
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#27AE60', marginBottom: '0.35rem', fontFamily: 'serif' }}>
                    TERIMA KASIH ATAS PESANAN ANDA
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: isDark ? '#FFFFFF' : '#1A1A1A', lineHeight: 1.5 }}>
                    Pesanan Anda telah selesai disajikan oleh Dapur & Barista KOPIMAGE. Selamat menikmati!
                  </p>
                </div>
              ) : isReady ? (
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#27AE60', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                    PESANAN SIAP DIHIDANGKAN
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
                    Pesanan Anda telah selesai diracik dan siap diantarkan ke meja Anda.
                  </p>
                </div>
              ) : isApproved ? (
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#27AE60', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                    PEMBAYARAN TERVERIFIKASI
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
                    Pesanan Anda telah disetujui Admin dan sedang diracik oleh Dapur & Barista KopiMage.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: isDark ? '#D4A373' : '#9E1F1F', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                    PESANAN SEDANG DIRACIK
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
                    Pesanan Anda telah diteruskan ke Dapur & Barista KopiMage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* REALTIME STATUS TRACKER STEPS */}
          {!isCancelled && (
            <div style={{ marginBottom: '1.5rem', background: isDark ? '#0E0C0A' : '#FFFFFF', padding: '1rem', borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #9E1F1F' }}>
              <span style={{ fontSize: '0.72rem', color: isDark ? '#A89F91' : '#555555', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'monospace', display: 'block', marginBottom: '0.8rem' }}>
                PROGRES REALTIME DAPUR & KASIR:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {/* Step 1: Terkirim */}
                <div style={{ padding: '0.6rem 0.3rem', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F5', border: '1px solid #2ECC71' }}>
                  <span style={{ fontSize: '0.65rem', display: 'block', color: '#27AE60', fontWeight: 800, fontFamily: 'monospace' }}>
                    TERKIRIM
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#FFF' : '#1A1A1A' }}>Kasir Admin</span>
                </div>

                {/* Step 2: Diproses Dapur */}
                <div style={{ padding: '0.6rem 0.3rem', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F5', border: isCompleted ? '1px solid #2ECC71' : isCancellationRequested ? '1px solid #E67E22' : (isDark ? '1px solid #D4A373' : '1px solid #9E1F1F') }}>
                  <span style={{ fontSize: '0.65rem', display: 'block', color: isCompleted ? '#27AE60' : isCancellationRequested ? '#E67E22' : (isDark ? '#D4A373' : '#9E1F1F'), fontWeight: 800, fontFamily: 'monospace' }}>
                    {isCompleted ? 'SELESAI' : isCancellationRequested ? 'BATAL?' : 'DIPROSES'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#FFF' : '#1A1A1A' }}>
                    {isCancellationRequested ? 'Menunggu Admin' : 'Dapur & Barista'}
                  </span>
                </div>

                {/* Step 3: Siap Hidangkan */}
                <div style={{ padding: '0.6rem 0.3rem', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F5', border: isReady || isCompleted ? '1px solid #2ECC71' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)') }}>
                  <span style={{ fontSize: '0.65rem', display: 'block', color: isReady || isCompleted ? '#27AE60' : (isDark ? '#666' : '#888'), fontWeight: 800, fontFamily: 'monospace' }}>
                    {isCompleted ? 'SELESAI' : isReady ? 'SIAP' : 'ANTREAN'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isReady || isCompleted ? (isDark ? '#FFF' : '#1A1A1A') : (isDark ? '#666' : '#888') }}>
                    {isCompleted ? 'Disajikan' : 'Siap Meja'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ITEM RINGKASAN */}
          {createdOrder.items && createdOrder.items.length > 0 && (
            <div style={{ marginBottom: '1.5rem', background: isDark ? '#0E0C0A' : '#FFFFFF', padding: '1rem', borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #9E1F1F' }}>
              <span style={{ fontSize: '0.72rem', color: isDark ? '#A89F91' : '#555555', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'monospace', display: 'block', marginBottom: '0.6rem' }}>
                RINCIAN ITEM PESANAN:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {createdOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: isCancelled ? '#888' : (isDark ? '#FFFFFF' : '#1A1A1A'), textDecoration: isCancelled ? 'line-through' : 'none' }}>
                    <span>{item.quantity}x {item.item_name}</span>
                    <span style={{ color: isCancelled ? '#888' : (isDark ? '#D4A373' : '#9E1F1F'), fontWeight: 700, fontFamily: 'monospace' }}>Rp {(item.subtotal || item.unit_price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(158, 31, 31, 0.2)', marginTop: '0.8rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: isCancelled ? '#888' : (isDark ? '#FFF' : '#1A1A1A'), textDecoration: isCancelled ? 'line-through' : 'none' }}>
                <span>Total Pembayaran</span>
                <span style={{ color: isCancelled ? '#888' : (isDark ? '#FFFFFF' : '#9E1F1F'), fontFamily: 'monospace' }}>Rp {createdOrder.total_amount?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* CANCELLATION CONFIRMATION DIALOG */}
          {showCancelConfirm && (
            <div style={{ marginBottom: '1.5rem', background: isDark ? '#1A1210' : '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: isDark ? '1px solid rgba(231, 76, 60, 0.4)' : '1.5px solid #9E1F1F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={18} color="#E74C3C" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#E74C3C' }}>Konfirmasi Pembatalan Pesanan</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', marginBottom: '1rem', lineHeight: 1.5 }}>
                Pembatalan akan dikirimkan ke Admin untuk ditinjau. Pesanan belum dibatalkan sampai Admin menyetujui.
              </p>

              <label style={{ fontSize: '0.82rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Alasan Pembatalan:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: isDark ? '#0E0B0A' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                  borderRadius: '10px',
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                  fontSize: '0.85rem',
                  outline: 'none',
                  marginBottom: '0.65rem',
                }}
              >
                <option value="Berubah pikiran / ingin ganti menu">Berubah pikiran / ingin ganti menu</option>
                <option value="Terlalu lama menunggu">Terlalu lama menunggu</option>
                <option value="Salah pilih menu / meja">Salah pilih menu / meja</option>
                <option value="Ada keperluan mendadak harus pergi">Ada keperluan mendadak harus pergi</option>
                <option value="Custom">Alasan lain (tulis sendiri)</option>
              </select>

              {cancelReason === 'Custom' && (
                <input
                  type="text"
                  placeholder="Tulis alasan pembatalan..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: isDark ? '#0E0B0A' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F',
                    borderRadius: '10px',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginBottom: '0.65rem',
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#F0EBE8',
                    color: isDark ? '#A89F91' : '#1A1A1A',
                    fontWeight: 700,
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  Kembali
                </button>
                <button
                  onClick={handleCancellationRequest}
                  disabled={isCancelling || (cancelReason === 'Custom' && !customCancelReason.trim())}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(231, 76, 60, 0.2)' : '#FDEDEC',
                    color: '#E74C3C',
                    fontWeight: 800,
                    border: '1px solid #E74C3C',
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    opacity: isCancelling || (cancelReason === 'Custom' && !customCancelReason.trim()) ? 0.5 : 1,
                  }}
                >
                  {isCancelling ? 'Mengirim...' : 'Konfirmasi Batalkan'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* CANCELLED: Show "Kembali ke Menu" button */}
            {isCancelled ? (
              <button
                onClick={handleClearCancelledOrder}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: isDark ? '#B82E2E' : '#9E1F1F',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  border: isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>KEMBALI KE MENU (PESAN ULANG)</span>
              </button>
            ) : (
              <>
                {/* TAMBAH PESANAN LAIN */}
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '10px',
                    background: isDark ? '#B82E2E' : '#9E1F1F',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    border: isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>TAMBAH PESANAN LAIN (PILIH MENU)</span>
                </button>

                {/* BATALKAN PESANAN — only when status allows */}
                {canRequestCancel && !showCancelConfirm && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: isDark ? 'rgba(231, 76, 60, 0.1)' : '#FDEDEC',
                      color: '#E74C3C',
                      fontWeight: 700,
                      border: '1px solid rgba(231, 76, 60, 0.3)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <XCircle size={16} />
                    <span>Batalkan Pesanan</span>
                  </button>
                )}

                {/* MENUNGGU KONFIRMASI — when cancellation requested */}
                {isCancellationRequested && (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: isDark ? 'rgba(230, 126, 34, 0.1)' : '#FFF9F4',
                      color: '#E67E22',
                      fontWeight: 700,
                      border: '1px solid rgba(230, 126, 34, 0.3)',
                      cursor: 'not-allowed',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      opacity: 0.7,
                    }}
                  >
                    <Clock size={16} />
                    <span>Menunggu Konfirmasi Admin...</span>
                  </button>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '24px',
          padding: '1.25rem 1.5rem',
          position: 'relative',
          background: isDark ? '#161210' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.8)' : '0 20px 50px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header (Fixed at Top - Never cut off) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F', paddingBottom: '0.85rem', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 800, margin: 0, fontFamily: 'serif' }}>Checkout Pesanan</h3>
            <span style={{ fontSize: '0.78rem', color: isDark ? '#D4A373' : '#9E1F1F', fontWeight: 600, fontFamily: 'monospace' }}>KEDAI KOPIMAGE SOREANG</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5EBEB',
              border: isDark ? 'none' : '1px solid #9E1F1F',
              color: isDark ? '#F7F4EF' : '#1A1A1A',
              padding: '0.4rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '-0.2rem',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#E74C3C', fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          
          {/* Mode Pemesanan */}
          <div>
            <label style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              MODE PEMESANAN:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMode('dine-in')}
                style={{
                  padding: '0.8rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  border: mode === 'dine-in'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.15)'),
                  background: mode === 'dine-in'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: mode === 'dine-in' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  transition: 'all 0.2s ease',
                }}
              >
                <UtensilsCrossed size={16} />
                <span>Makan di Tempat</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('takeaway')}
                style={{
                  padding: '0.8rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  border: mode === 'takeaway'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.15)'),
                  background: mode === 'takeaway'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: mode === 'takeaway' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  transition: 'all 0.2s ease',
                }}
              >
                <ShoppingBag size={16} />
                <span>Dibawa Pulang</span>
              </button>
            </div>
          </div>

          {/* Table Selector (If Dine-In) */}
          {mode === 'dine-in' && (
            <div>
              <label style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                PILIH MEJA KEDAI:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: isDark ? '#0E0B0A' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #9E1F1F',
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                {liveTables.map((t) => (
                  <option key={t.id || t.code} value={t.code || t.id} style={{ background: isDark ? '#161311' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
                    {t.name} ({t.area || 'Indoor AC'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                NAMA PEMESAN *
              </label>
              <input
                type="text"
                required
                placeholder="misal: Acelino"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDark ? '#0E0B0A' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #9E1F1F',
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                NO. WHATSAPP (WAJIB) *
              </label>
              <input
                type="tel"
                required
                placeholder="0813xxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isDark ? '#0E0B0A' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #9E1F1F',
                  borderRadius: '12px',
                  color: isDark ? '#FFFFFF' : '#1A1A1A',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.82rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              METODE PEMBAYARAN:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'cashier'
                    ? (isDark ? '1.5px solid #B82E2E' : '2px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F'),
                  background: paymentMethod === 'cashier'
                    ? (isDark ? 'rgba(184, 46, 46, 0.2)' : '#FDF7F7')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cashier"
                  checked={paymentMethod === 'cashier'}
                  onChange={() => setPaymentMethod('cashier')}
                  style={{ accentColor: '#9E1F1F' }}
                />
                <Store size={20} color={isDark ? '#D4A373' : '#9E1F1F'} />
                <div>
                  <div style={{ fontSize: '0.92rem', color: isDark ? '#FFFFFF' : (paymentMethod === 'cashier' ? '#9E1F1F' : '#1A1A1A'), fontWeight: 700 }}>Bayar di Kasir / Tempat</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555' }}>Bayar tunai/EDC saat mengambil/di meja</div>
                </div>
              </label>

              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'qris_static'
                    ? (isDark ? '1.5px solid #B82E2E' : '2px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F'),
                  background: paymentMethod === 'qris_static'
                    ? (isDark ? 'rgba(184, 46, 46, 0.2)' : '#FDF7F7')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="qris_static"
                  checked={paymentMethod === 'qris_static'}
                  onChange={() => setPaymentMethod('qris_static')}
                  style={{ accentColor: '#9E1F1F' }}
                />
                <QrCode size={20} color={isDark ? '#D4A373' : '#9E1F1F'} />
                <div>
                  <div style={{ fontSize: '0.92rem', color: isDark ? '#FFFFFF' : (paymentMethod === 'qris_static' ? '#9E1F1F' : '#1A1A1A'), fontWeight: 700 }}>QRIS Statis KOPIMAGE</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555' }}>Scan via GoPay/OVO/Dana/BCA Mobile</div>
                </div>
              </label>

              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'bank_transfer'
                    ? (isDark ? '1.5px solid #B82E2E' : '2px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #9E1F1F'),
                  background: paymentMethod === 'bank_transfer'
                    ? (isDark ? 'rgba(184, 46, 46, 0.2)' : '#FDF7F7')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  style={{ accentColor: '#9E1F1F' }}
                />
                <CreditCard size={20} color={isDark ? '#D4A373' : '#9E1F1F'} />
                <div>
                  <div style={{ fontSize: '0.92rem', color: isDark ? '#FFFFFF' : (paymentMethod === 'bank_transfer' ? '#9E1F1F' : '#1A1A1A'), fontWeight: 700 }}>Transfer Bank BCA</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555' }}>Rekening 1234567890 a.n KOPIMAGE</div>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Proof (If QRIS / Transfer) */}
          {(paymentMethod === 'qris_static' || paymentMethod === 'bank_transfer') && (
            <div style={{ background: isDark ? '#0E0B0A' : '#FAF7F5', padding: '1rem', borderRadius: '12px', border: isDark ? '1px dashed rgba(255,255,255,0.2)' : '1px dashed #9E1F1F' }}>
              <label style={{ fontSize: '0.85rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Upload size={16} />
                <span>Upload Bukti Transfer / QRIS:</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                style={{ fontSize: '0.82rem', color: isDark ? '#FFFFFF' : '#1A1A1A' }}
              />
            </div>
          )}

          {/* Order Summary & Final CTA */}
          <div style={{ paddingTop: '1.25rem', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: isDark ? '#A89F91' : '#666666', display: 'block', fontFamily: 'monospace' }}>TOTAL PEMBAYARAN:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#9E1F1F', fontFamily: 'monospace' }}>
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                padding: '0.85rem 1.6rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: isDark ? '#B82E2E' : '#9E1F1F',
                color: '#FFFFFF',
                border: isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <CheckCircle size={18} strokeWidth={2.5} />
              <span>{isSubmitting ? 'Memproses...' : 'Buat Pesanan'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

