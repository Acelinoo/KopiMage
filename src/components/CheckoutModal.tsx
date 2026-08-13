'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { OrderMode, PaymentMethod } from '@/types/order';
import { VALID_TABLES_REGISTRY } from '@/types/table';
import { X, CheckCircle, Upload, QrCode, CreditCard, Store, UtensilsCrossed, ShoppingBag, AlertCircle, Loader2, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onSuccess }) => {
  const { cartItems, estimatedSubtotal, clearCart, activeTableId } = useCart();
  const router = useRouter();

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

  // Fetch Live Tables from /api/tables & LocalStorage fallback
  React.useEffect(() => {
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
    setSubmissionStep(1); // Step 1: Validating payload

    try {
      await new Promise((r) => setTimeout(r, 400)); // Smooth animation delay
      setSubmissionStep(2); // Step 2: Uploading data & payment proof

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

      setSubmissionStep(3); // Step 3: Dispatching to Order API

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

      // Save tracking secret for security check
      if (data.order?.tracking_secret) {
        localStorage.setItem(`kopimage_tracking_${data.order.id}`, data.order.tracking_secret);
      }

      const targetUrl = `/order/${data.order.id}?secret=${data.order.tracking_secret}`;

      // Prefetch route immediately for instant transition
      router.prefetch(targetUrl);

      setSubmissionStep(4); // Step 4: Redirection ready
      await new Promise((r) => setTimeout(r, 600));

      clearCart();
      router.push(targetUrl);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat checkout.');
      setSubmissionStep(0);
      setIsSubmitting(false);
    }
  };

  // Full-Screen Luxury Step Progress Overlay to prevent any transition gap
  if (submissionStep > 0) {
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
            {submissionStep < 4 ? (
              <Loader2 className="w-10 h-10 text-[#D4A373] animate-spin" />
            ) : (
              <CheckCircle className="w-12 h-12 text-[#2ECC71] animate-bounce" />
            )}
          </div>
        </div>

        <h3 style={{ fontFamily: 'serif', fontSize: '1.8rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.5rem' }}>
          {submissionStep === 4 ? 'Pesanan Berhasil Dibuat!' : 'Memproses Pesanan Anda...'}
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#D4A373', maxWidth: '420px', marginBottom: '2.5rem', lineHeight: 1.5 }}>
          Mohon tunggu sebentar, sistem KopiMage sedang memproses dan menyambungkan pesanan Anda ke Stasiun Dapur.
        </p>

        {/* Steps Progress Checklist */}
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 1 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 1 ? '#2ECC71' : submissionStep === 1 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 1 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 1 ? 600 : 400, color: submissionStep >= 1 ? '#F7F4EF' : '#777' }}>
              Memverifikasi rincian menu & nomor meja
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 2 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 2 ? '#2ECC71' : submissionStep === 2 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 2 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 2 ? '✓' : '2'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 2 ? 600 : 400, color: submissionStep >= 2 ? '#F7F4EF' : '#777' }}>
              Mengirimkan data & bukti pembayaran
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 3 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep > 3 ? '#2ECC71' : submissionStep === 3 ? '#D4A373' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep >= 3 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep > 3 ? '✓' : '3'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 3 ? 600 : 400, color: submissionStep >= 3 ? '#F7F4EF' : '#777' }}>
              Menyambungkan ke Stasiun Dapur KopiMage
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', opacity: submissionStep >= 4 ? 1 : 0.35, transition: 'all 0.3s ease' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: submissionStep === 4 ? '#2ECC71' : '#2A2421', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: submissionStep === 4 ? '#000' : '#777', flexShrink: 0 }}>
              {submissionStep === 4 ? '✓' : '4'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: submissionStep === 4 ? 600 : 400, color: submissionStep === 4 ? '#2ECC71' : '#777' }}>
              Membuka Halaman Pelacakan Pesanan...
            </span>
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

