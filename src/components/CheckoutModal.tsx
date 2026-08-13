'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { OrderMode, PaymentMethod } from '@/types/order';
import { X, CheckCircle, Upload, QrCode, CreditCard, Store, UtensilsCrossed, ShoppingBag, AlertCircle, Loader2, Coffee, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onSuccess }) => {
  const { cartItems, estimatedSubtotal, clearCart, activeTableId } = useCart();

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

  // Real-time Polling for Order Status Updates inside 1 Single Popup
  useEffect(() => {
    if (!createdOrder?.id) return;

    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const res = await fetch('/api/admin/orders?status=ALL');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const matched = data.orders.find((o: any) => o.id === createdOrder.id);
          if (matched) {
            setCreatedOrder(matched);
          }
        }
      } catch (err) {
        console.warn('Realtime order polling warning:', err);
      } finally {
        setIsPolling(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createdOrder?.id]);

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
    setSubmissionStep(1); // Step 1: Mengecek pemesanan & meja

    try {
      await new Promise((r) => setTimeout(r, 450)); // Smooth step delay
      setSubmissionStep(2); // Step 2: Membuat pesanan di sistem

      let uploadedProofUrl: string | null = null;

      // Handle payment proof upload to Supabase Storage if present
      if (proofFile && paymentMethod !== 'cashier') {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const fileExt = proofFile.name.split('.').pop() || 'jpg';
        const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, proofFile, { cacheControl: '3600', upsert: true });

          if (!uploadErr && uploadData) {
            const { data: publicData } = supabase.storage
              .from('payment-proofs')
              .getPublicUrl(uploadData.path);
            uploadedProofUrl = publicData?.publicUrl || uploadData.path;
          }
        } catch (sErr) {
          console.warn('Supabase storage upload fallback:', sErr);
        }

        if (!uploadedProofUrl) {
          uploadedProofUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(proofFile);
          });
        }
      }

      setSubmissionStep(3); // Step 3: Mengirimkan pesanan ke Admin & Dapur
      await new Promise((r) => setTimeout(r, 450));

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

      // Call Server-Side Zero-Trust Order API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          background: 'rgba(14, 11, 10, 0.96)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(184, 46, 46, 0.4) 0%, rgba(212, 163, 115, 0.15) 70%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(212, 163, 115, 0.4)',
              boxShadow: '0 0 50px rgba(184, 46, 46, 0.4)',
            }}
          >
            <Loader2 className="w-10 h-10 text-[#D4A373] animate-spin" />
          </div>
        </div>

        <h3 style={{ fontFamily: 'serif', fontSize: '1.8rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.5rem' }}>
          Memproses Pesanan Anda...
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#D4A373', maxWidth: '420px', marginBottom: '2.5rem', lineHeight: 1.5 }}>
          Mohon tunggu sebentar, sistem KopiMage sedang memverifikasi dan menyambungkan pesanan Anda ke Stasiun Dapur.
        </p>

        {/* Steps Progress Checklist */}
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 1 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 1 ? '#2ECC71' : submissionStep === 1 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 1 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 1 ? 600 : 400, color: submissionStep >= 1 ? '#F7F4EF' : '#777' }}>
              Mengecek pemesanan & nomor meja
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 2 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 2 ? '#2ECC71' : submissionStep === 2 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 2 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 2 ? '✓' : '2'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 2 ? 600 : 400, color: submissionStep >= 2 ? '#F7F4EF' : '#777' }}>
              Membuat pesanan di sistem KopiMage
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 3 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 3 ? '#2ECC71' : submissionStep === 3 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 3 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 3 ? '✓' : '3'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 3 ? 600 : 400, color: submissionStep >= 3 ? '#F7F4EF' : '#777' }}>
              Mengirimkan pesanan ke Admin Kasir & Dapur
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: UNIFIED SINGLE POPUP REAL-TIME ORDER STATUS TRACKER
  // (Muncul Langsung di 1 Popup Tanpa Redirect Halaman!)
  // ----------------------------------------------------
  if (createdOrder) {
    const isApproved = createdOrder.payment_status === 'PAID' || createdOrder.payment_method === 'cashier';
    const isReady = createdOrder.order_status === 'READY';
    const isCompleted = createdOrder.order_status === 'COMPLETED';

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
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '24px',
            padding: '2rem',
            position: 'relative',
            background: '#161311',
            border: isApproved ? '1px solid rgba(46, 204, 113, 0.5)' : '1px solid rgba(212, 163, 115, 0.4)',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 800 }}>STATUS PESANAN LIVE</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isApproved ? '#2ECC71' : '#E67E22', display: 'inline-block' }} className="animate-ping" />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: '#F7F4EF', fontWeight: 800, margin: 0, fontFamily: 'serif' }}>
                {createdOrder.order_number}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#A89F91', marginTop: '0.2rem' }}>
                {createdOrder.mode === 'dine-in' ? `Dine-In • MEJA ${createdOrder.table_id || '01'}` : 'Takeaway'} ({createdOrder.customer_name})
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* REALTIME APPROVAL ANIMATION BANNER */}
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              background: isReady
                ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.25) 0%, rgba(39, 174, 96, 0.1) 100%)'
                : isApproved
                ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.18) 0%, rgba(212, 163, 115, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(184, 46, 46, 0.1) 100%)',
              border: isReady
                ? '1px solid #2ECC71'
                : isApproved
                ? '1px solid rgba(46, 204, 113, 0.4)'
                : '1px solid rgba(230, 126, 34, 0.4)',
              textAlign: 'center',
            }}
          >
            {isReady ? (
              <div>
                <Coffee className="w-10 h-10 text-[#2ECC71] mx-auto mb-2 animate-bounce" />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2ECC71', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                  ☕ PESANAN SIAP DIHIDANGKAN!
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#F7F4EF' }}>
                  Pesanan Anda sudah selesai diracik oleh Barista & Dapur KopiMage dan siap diantarkan ke meja.
                </p>
              </div>
            ) : isApproved ? (
              <div>
                <CheckCircle className="w-9 h-9 text-[#2ECC71] mx-auto mb-2 animate-pulse" />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2ECC71', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                  ✓ PEMBAYARAN DIVERIFIKASI LUNAS!
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#F7F4EF' }}>
                  Pesanan Anda telah disetujui Admin dan sedang diracik oleh Dapur & Barista.
                </p>
              </div>
            ) : (
              <div>
                <Clock className="w-8 h-8 text-[#E67E22] mx-auto mb-2 animate-spin" style={{ animationDuration: '4s' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E67E22', marginBottom: '0.3rem', fontFamily: 'serif' }}>
                  ⏳ MENUNGGU VERIFIKASI ADMIN KASIR
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#D4A373' }}>
                  Pesanan Anda sudah dikirim ke Admin. Begitu pembayaran diverifikasi lunas, status di popup ini akan otomatis berubah menjadi <strong className="text-white">DIPROSES DAPUR</strong> secara real-time!
                </p>
              </div>
            )}
          </div>

          {/* REALTIME STATUS TRACKER STEPS */}
          <div style={{ marginBottom: '1.5rem', background: '#0E0C0A', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.7rem', color: '#A89F91', letterSpacing: '0.1em', uppercase: 'true', fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>
              PROGRES REALTIME DAPUR & KASIR:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              {/* Step 1: Verifikasi / Terkirim */}
              <div style={{ padding: '0.6rem 0.3rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: isApproved ? '1px solid #2ECC71' : '1px solid #E67E22' }}>
                <span style={{ fontSize: '0.65rem', display: 'block', color: isApproved ? '#2ECC71' : '#E67E22', fontWeight: 700 }}>
                  {isApproved ? '✓ TERVERIFIKASI' : '⏳ VERIFIKASI'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFF' }}>Kasir Admin</span>
              </div>

              {/* Step 2: Diproses Dapur */}
              <div style={{ padding: '0.6rem 0.3rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: createdOrder.order_status === 'PREPARING' || isReady || isCompleted ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.65rem', display: 'block', color: createdOrder.order_status === 'PREPARING' || isReady || isCompleted ? '#D4A373' : '#666', fontWeight: 700 }}>
                  {createdOrder.order_status === 'PREPARING' ? '👨‍🍳 DIPROSES' : isReady || isCompleted ? '✓ DIPROSES' : 'PENDING'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: createdOrder.order_status === 'PREPARING' || isReady || isCompleted ? '#FFF' : '#666' }}>Dapur & Barista</span>
              </div>

              {/* Step 3: Siap Hidangkan */}
              <div style={{ padding: '0.6rem 0.3rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: isReady || isCompleted ? '1px solid #2ECC71' : '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.65rem', display: 'block', color: isReady || isCompleted ? '#2ECC71' : '#666', fontWeight: 700 }}>
                  {isReady ? '☕ SIAP' : isCompleted ? '✓ SELESAI' : 'TUNGGU'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isReady || isCompleted ? '#FFF' : '#666' }}>Siap Meja</span>
              </div>
            </div>
          </div>

          {/* ITEM RINGKASAN */}
          {createdOrder.items && createdOrder.items.length > 0 && (
            <div style={{ marginBottom: '1.5rem', background: '#0E0C0A', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.7rem', color: '#A89F91', letterSpacing: '0.1em', uppercase: 'true', fontWeight: 700, display: 'block', marginBottom: '0.6rem' }}>
                RINCIAN ITEM PESANAN:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {createdOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#F7F4EF' }}>
                    <span>{item.quantity}x {item.item_name}</span>
                    <span style={{ color: '#D4A373', fontWeight: 600 }}>Rp {(item.subtotal || item.unit_price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px border rgba(255,255,255,0.1)', marginTop: '0.8rem', pt: '0.6rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>
                <span>Total Pembayaran</span>
                <span style={{ color: '#D4A373' }}>Rp {createdOrder.total_amount?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: '14px',
                background: '#D4A373',
                color: '#0E0C0A',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Tutup Popup
            </button>
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
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '20px',
          padding: '2rem',
          position: 'relative',
          background: '#161311',
          border: '1px solid rgba(212, 163, 115, 0.3)',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', color: '#F7F4EF', fontWeight: 800, margin: 0, fontFamily: 'serif' }}>Checkout Pesanan</h3>
            <span style={{ fontSize: '0.8rem', color: '#D4A373', fontWeight: 600 }}>Kedai KOPIMAGE Soreang</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#C4BBB4', cursor: 'pointer', padding: '0.4rem' }}>
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#E74C3C', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Mode Pemesanan */}
          <div>
            <label style={{ fontSize: '0.88rem', color: '#C4BBB4', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Mode Pemesanan:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMode('dine-in')}
                style={{
                  padding: '0.8rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  border: mode === 'dine-in' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'dine-in' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: mode === 'dine-in' ? '#D4A373' : '#C4BBB4',
                  transition: 'all 0.2s ease',
                }}
              >
                <UtensilsCrossed size={16} />
                <span>Makan di Tempat (Dine-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('takeaway')}
                style={{
                  padding: '0.8rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  border: mode === 'takeaway' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'takeaway' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: mode === 'takeaway' ? '#D4A373' : '#C4BBB4',
                  transition: 'all 0.2s ease',
                }}
              >
                <ShoppingBag size={16} />
                <span>Dibawa Pulang (Takeaway)</span>
              </button>
            </div>
          </div>

          {/* Table Selector (If Dine-In) */}
          {mode === 'dine-in' && (
            <div>
              <label style={{ fontSize: '0.88rem', color: '#C4BBB4', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Pilih Meja Kedai:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 26, 23, 0.9)',
                  border: '1px solid rgba(212, 163, 115, 0.3)',
                  borderRadius: '12px',
                  color: '#F7F4EF',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              >
                {liveTables.map((t) => (
                  <option key={t.id || t.code} value={t.code || t.id} style={{ background: '#161311', color: '#F7F4EF' }}>
                    {t.name} ({t.area || 'Indoor AC'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#C4BBB4', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Nama Pemesan *
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
                  background: 'rgba(30, 26, 23, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#F7F4EF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#C4BBB4', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                No. WhatsApp (Wajib) *
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
                  background: 'rgba(30, 26, 23, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#F7F4EF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '0.88rem', color: '#C4BBB4', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Metode Pembayaran:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'cashier' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'cashier' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
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
                />
                <Store size={20} color="#D4A373" />
                <div>
                  <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>Bayar di Kasir / Tempat</div>
                  <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Bayar tunai/EDC saat mengambil/di meja</div>
                </div>
              </label>

              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'qris_static' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'qris_static' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
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
                />
                <QrCode size={20} color="#D4A373" />
                <div>
                  <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>QRIS Statis KOPIMAGE</div>
                  <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Scan via GoPay/OVO/Dana/BCA Mobile</div>
                </div>
              </label>

              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: paymentMethod === 'bank_transfer' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'bank_transfer' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
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
                />
                <CreditCard size={20} color="#D4A373" />
                <div>
                  <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>Transfer Bank BCA</div>
                  <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Rekening 1234567890 a.n KOPIMAGE</div>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Proof (If QRIS / Transfer) */}
          {(paymentMethod === 'qris_static' || paymentMethod === 'bank_transfer') && (
            <div style={{ background: 'rgba(30, 26, 23, 0.8)', padding: '1rem', borderRadius: '12px', border: '1px dashed rgba(212, 163, 115, 0.3)' }}>
              <label style={{ fontSize: '0.85rem', color: '#D4A373', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Upload size={16} />
                <span>Upload Bukti Transfer / QRIS (Opsional sekarang, bisa di tracker):</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                style={{ fontSize: '0.82rem', color: '#C4BBB4' }}
              />
            </div>
          )}

          {/* Order Summary & Final CTA */}
          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(212, 163, 115, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#8E847C', display: 'block' }}>Total Pembayaran:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D4A373', fontFamily: 'serif' }}>
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
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
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
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

