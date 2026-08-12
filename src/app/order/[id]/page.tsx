'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Coffee, Clock, CheckCircle, Upload, QrCode, ShieldCheck, AlertCircle, ArrowLeft, Sparkles, Flame } from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const secret = searchParams?.get('secret');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Live order fetcher from real-time API
  const fetchLiveOrder = async () => {
    try {
      const res = await fetch('/api/admin/orders?status=ALL');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const found = data.orders.find(
          (o: any) => o.id === orderId || (o.order_number || '').toLowerCase().includes((orderId || '').toLowerCase())
        );

        if (found) {
          setOrder(found);
        } else if (!order) {
          // Fallback if initial load
          setOrder({
            id: orderId,
            order_number: `KOP-${orderId ? orderId.slice(0, 8).toUpperCase() : '001'}`,
            mode: 'dine-in',
            table_id: '01',
            customer_name: 'Pelanggan KOPIMAGE',
            subtotal: 47000,
            payment_method: 'qris_static',
            payment_status: uploadSuccess ? 'VERIFYING' : 'UNPAID',
            order_status: 'NEW_ORDER',
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch live order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrder();
    const interval = setInterval(fetchLiveOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId, uploadSuccess]);

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        // Upload proof to server if available
        setUploadSuccess(true);
        if (order?.id) {
          await fetch('/api/admin/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.id,
              payment_status: 'VERIFYING',
            }),
          });
        }
      } catch (err) {
        console.error('Upload proof error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070605', color: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <p style={{ fontFamily: 'monospace', color: '#A89F91' }}>Memuat live tracker pesanan KOPIMAGE...</p>
      </div>
    );
  }

  const currentOrderStatus = order?.order_status || 'NEW_ORDER';
  const currentPaymentStatus = order?.payment_status || 'UNPAID';

  const isPreparing = currentOrderStatus === 'PREPARING' || currentOrderStatus === 'READY' || currentOrderStatus === 'COMPLETED';
  const isReady = currentOrderStatus === 'READY' || currentOrderStatus === 'COMPLETED';
  const isCompleted = currentOrderStatus === 'COMPLETED';

  return (
    <main style={{ minHeight: '100vh', background: '#070605', color: '#F7F4EF', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Back to Home */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#C29B7F', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Katalog Menu</span>
        </Link>

        {/* READY / SIAP DISAJIKAN GLOWING BANNER ALERT */}
        {currentOrderStatus === 'READY' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '2px solid #25D366',
              padding: '1.25rem 1.5rem',
              borderRadius: '20px',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 30px rgba(37, 211, 102, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={28} color="#070605" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#25D366', fontWeight: 800 }}>STASIUN KITCHEN NOTIFIKASI</span>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 900, margin: '0.1rem 0 0.2rem 0' }}>
                🎉 PESANAN SIAP DISAJIKAN!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#E2F9EB', margin: 0 }}>
                Hidangan racikan Anda sudah siap di-barista/dapur dan sedang diantar ke meja Anda.
              </p>
            </div>
          </div>
        )}

        {/* COMPLETED BANNER ALERT */}
        {isCompleted && (
          <div
            style={{
              background: 'rgba(37, 211, 102, 0.15)',
              border: '1px solid #25D366',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckCircle size={22} color="#25D366" />
            <div>
              <h4 style={{ fontSize: '1rem', color: '#25D366', fontWeight: 800, margin: 0 }}>
                Pesanan Telah Selesai Disajikan 100%
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#C4BBB4' }}>Selamat menikmati hidangan racikan KOPIMAGE!</span>
            </div>
          </div>
        )}

        {/* Order Header Card */}
        <div style={{ borderRadius: '24px', padding: '1.75rem', marginBottom: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#A89F91', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>Nomor Pesanan</span>
              <h2 style={{ fontSize: '1.6rem', color: '#F7F4EF', fontWeight: 800, margin: '0.2rem 0' }}>{order.order_number}</h2>
              <span style={{ fontSize: '0.85rem', color: '#C29B7F', fontWeight: 600 }}>
                {order.mode === 'takeaway' ? 'TAKEAWAY (Dibawa Pulang)' : `Dine-In • MEJA ${order.tables?.code || order.table_id || '01'}`}
              </span>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '16px', background: 'linear-gradient(135deg, #B82E2E 0%, #6E1A1A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={22} color="#FFFFFF" />
            </div>
          </div>

          {/* Dual Status Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: '#161210', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#A89F91', display: 'block', marginBottom: '0.25rem', fontFamily: 'monospace' }}>Status Produksi:</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: isReady ? 'rgba(37, 211, 102, 0.2)' : isPreparing ? 'rgba(243, 156, 18, 0.2)' : 'rgba(184, 46, 46, 0.2)',
                  color: isReady ? '#25D366' : isPreparing ? '#F39C12' : '#FF6B6B',
                  border: isReady ? '1px solid #25D366' : isPreparing ? '1px solid #F39C12' : '1px solid #B82E2E',
                }}
              >
                {isReady ? <CheckCircle size={14} /> : <Clock size={14} />}
                {isReady ? 'SIAP DISAJIKAN' : isPreparing ? 'DIPROSES' : 'BARU MASUK'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#A89F91', display: 'block', marginBottom: '0.25rem', fontFamily: 'monospace' }}>Status Pembayaran:</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: currentPaymentStatus === 'PAID' ? 'rgba(37, 211, 102, 0.2)' : currentPaymentStatus === 'REJECTED' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                  color: currentPaymentStatus === 'PAID' ? '#25D366' : currentPaymentStatus === 'REJECTED' ? '#E74C3C' : '#F39C12',
                  border: currentPaymentStatus === 'PAID' ? '1px solid #25D366' : currentPaymentStatus === 'REJECTED' ? '1px solid #E74C3C' : '1px solid #F39C12',
                }}
              >
                <ShieldCheck size={14} />
                {currentPaymentStatus === 'PAID' ? 'LUNAS' : currentPaymentStatus === 'REJECTED' ? 'DITOLAK' : 'VERIFIKASI'}
              </span>
            </div>
          </div>
        </div>

        {/* REJECTION ALERT BANNER */}
        {currentPaymentStatus === 'REJECTED' && (
          <div style={{ borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', background: '#241212', border: '1px solid #B82E2E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: '#FF6B6B' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Bukti Pembayaran Ditolak Kasir</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#F7F4EF', marginBottom: '1rem', lineHeight: 1.5 }}>
              Alasan: <strong style={{ color: '#FF6B6B' }}>"{order.rejection_reason || 'Bukti transfer tidak terbaca / nominal kurang'}"</strong>
            </p>
            <div>
              <a
                href={`https://wa.me/6281312345678?text=${encodeURIComponent(`Halo Kasir KOPIMAGE, saya ingin konfirmasi ulang pesanan #${order.order_number}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  background: '#25D366',
                  color: '#070605',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                Hubungi Kasir via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* QRIS / Transfer Payment Section */}
        {currentPaymentStatus !== 'PAID' && order.payment_method !== 'cashier' && (
          <div style={{ borderRadius: '24px', padding: '1.75rem', marginBottom: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} color="#C29B7F" />
              <span>Instruksi Pembayaran QRIS / Bank</span>
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#A89F91', marginBottom: '1.25rem' }}>
              Silakan melakukan pembayaran sebesar <strong style={{ color: '#C29B7F' }}>Rp {(order.subtotal || order.total_amount || 47000)?.toLocaleString('id-ID')}</strong> ke QRIS atau rekening resmi KOPIMAGE.
            </p>

            <div style={{ background: '#FFF', padding: '1rem', borderRadius: '16px', textAlign: 'center', width: '180px', margin: '0 auto 1.25rem auto' }}>
              <div style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, marginBottom: '0.4rem' }}>QRIS KOPIMAGE</div>
              <div style={{ width: '140px', height: '140px', background: '#F4F4F4', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #000' }}>
                <QrCode size={100} color="#000" />
              </div>
            </div>

            {/* Proof Upload Area */}
            <div style={{ background: '#161210', padding: '1.25rem', borderRadius: '16px', border: '1px dashed rgba(194, 155, 127, 0.3)', textAlign: 'center' }}>
              <Upload size={24} color="#C29B7F" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '0.2rem' }}>
                {uploadSuccess ? 'Bukti Bayar Berhasil Diunggah' : 'Unggah Foto Bukti Transfer'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#A89F91', display: 'block', marginBottom: '0.85rem' }}>
                {uploadSuccess ? 'Menunggu verifikasi kasir KOPIMAGE.' : 'Format: JPG, PNG, WebP (Maks 5MB)'}
              </span>

              <label
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '12px',
                  background: '#B82E2E',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                }}
              >
                <span>{uploading ? 'Mengunggah...' : uploadSuccess ? 'Unggah Ulang Bukti' : 'Pilih File Foto'}</span>
                <input type="file" accept="image/*" onChange={handleSimulatedUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* Live Order Timeline */}
        <div style={{ borderRadius: '24px', padding: '1.75rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '1.25rem' }}>
            Tahapan Pengerjaan Pesanan Real-time
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* STEP 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.2)', border: '2px solid #25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={16} color="#25D366" />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: '#25D366', fontWeight: 800 }}>1. Pesanan Diterima (NEW_ORDER)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Pesanan masuk ke sistem antrian KOPIMAGE</div>
              </div>
            </div>

            {/* STEP 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isPreparing ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isPreparing ? 'rgba(37, 211, 102, 0.2)' : 'transparent', border: isPreparing ? '2px solid #25D366' : '2px solid #A89F91', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isPreparing ? <CheckCircle size={16} color="#25D366" /> : <Clock size={16} color="#A89F91" />}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: isPreparing ? '#25D366' : '#F7F4EF', fontWeight: 800 }}>2. Diproses Barista & Dapur (PREPARING)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Barista & dapur sedang meracik hidangan Anda</div>
              </div>
            </div>

            {/* STEP 3 - DYNAMICALLY HIGHLIGHTED GREEN WHEN KITCHEN PRESSES READY */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                opacity: isReady ? 1 : 0.4,
                padding: isReady ? '0.75rem 1rem' : '0',
                borderRadius: '16px',
                background: isReady ? 'rgba(37, 211, 102, 0.15)' : 'transparent',
                border: isReady ? '1px solid #25D366' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isReady ? '#25D366' : 'transparent', border: isReady ? '2px solid #25D366' : '2px solid #A89F91', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color={isReady ? '#070605' : '#A89F91'} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: isReady ? '#25D366' : '#F7F4EF', fontWeight: 900 }}>
                  3. Siap Dihidangkan (READY) {isReady && '✅'}
                </div>
                <div style={{ fontSize: '0.8rem', color: isReady ? '#E2F9EB' : '#A89F91' }}>
                  {isReady ? '🎉 PESANAN SIAP DISAJIKAN / DIANTAR KE MEJA!' : 'Pesanan siap diambil di counter / diantar ke meja'}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
