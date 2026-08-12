'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { OrderMode, PaymentMethod } from '@/types/order';
import { VALID_TABLES_REGISTRY } from '@/types/table';
import { X, CheckCircle, Upload, QrCode, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
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
            if (merged.length > 0) {
              const matched = merged.find((t: any) => t.code === formattedInitialTable || t.code === activeTableId || t.id === activeTableId);
              if (matched) {
                setSelectedTable(matched.code || matched.id);
              } else {
                setSelectedTable(merged[0].code || merged[0].id);
              }
            }
          }
        })
        .catch((err) => {
          console.error('Failed to fetch live tables in CheckoutModal:', err);
          setLiveTables(parsedLocal);
          if (parsedLocal.length > 0) {
            setSelectedTable(parsedLocal[0].code || parsedLocal[0].id);
          }
        });
    }
  }, [activeTableId]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Harap isi Nama Pemesan.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Harap masukkan Nomor WhatsApp Anda agar kasir dapat mengonfirmasi pesanan.');
      return;
    }

    if (mode === 'dine-in' && !selectedTable) {
      setErrorMessage('Harap pilih Nomor Meja untuk Dine-In.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedProofUrl: string | null = null;

      // Upload payment proof if QRIS/Transfer and file selected
      if (paymentMethod !== 'cashier' && proofFile) {
        // Validation: Max 5MB & Image format only
        if (proofFile.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran foto bukti transfer maksimal 5MB.');
        }
        if (!proofFile.type.startsWith('image/')) {
          throw new Error('File bukti transfer harus berupa gambar (JPG, PNG, WebP).');
        }

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

        // Fallback to Base64 data URL if storage bucket fails/errors
        if (!uploadedProofUrl) {
          uploadedProofUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(proofFile);
          });
        }
      }

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

      clearCart();
      onSuccess();

      // Navigate to Live Order Tracker
      router.push(`/order/${data.order.id}?secret=${data.order.tracking_secret}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
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
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          position: 'relative',
          background: '#161311',
          border: '1px solid var(--border-active)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: '#F7F4EF', fontWeight: 800, margin: 0 }}>Checkout Pesanan</h3>
            <span style={{ fontSize: '0.8rem', color: '#D4A373' }}>Kedai KOPIMAGE Soreang</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#C4BBB4', cursor: 'pointer', padding: '0.4rem' }}>
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: '#E74C3C', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: mode === 'dine-in' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'dine-in' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: mode === 'dine-in' ? '#D4A373' : '#C4BBB4',
                }}
              >
                🍽️ Makan di Tempat (Dine-In)
              </button>
              <button
                type="button"
                onClick={() => setMode('takeaway')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: mode === 'takeaway' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: mode === 'takeaway' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: mode === 'takeaway' ? '#D4A373' : '#C4BBB4',
                }}
              >
                🛍️ Dibawa Pulang (Takeaway)
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
                  borderRadius: 'var(--radius-md)',
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
                  borderRadius: 'var(--radius-md)',
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
                  borderRadius: 'var(--radius-md)',
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
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'cashier' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'cashier' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cashier"
                  checked={paymentMethod === 'cashier'}
                  onChange={() => setPaymentMethod('cashier')}
                />
                <DollarSign size={20} color="#D4A373" />
                <div>
                  <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>Bayar di Kasir / Tempat</div>
                  <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Bayar tunai/EDC saat mengambil/di meja</div>
                </div>
              </label>

              <label
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'qris_static' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'qris_static' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
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
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'bank_transfer' ? '1px solid #D4A373' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'bank_transfer' ? 'rgba(212, 163, 115, 0.15)' : 'rgba(30, 26, 23, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
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
            <div style={{ background: 'rgba(30, 26, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(212, 163, 115, 0.3)' }}>
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
          <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(212, 163, 115, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#8E847C', display: 'block' }}>Total Pembayaran:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D4A373' }}>
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.5rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              <CheckCircle size={18} />
              <span>{isSubmitting ? 'Memproses...' : 'Buat Pesanan'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
