'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Coffee, Clock, CheckCircle, Upload, QrCode, ShieldCheck, AlertCircle, ArrowLeft, Sparkles, Flame, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { loadSnapScript } from '@/lib/payment/snapLoader';

export default function OrderTrackerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const secret = searchParams?.get('secret');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isOpeningSnap, setIsOpeningSnap] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handlePayWithMidtrans = async () => {
    if (!order?.id) return;
    setIsOpeningSnap(true);
    setPaymentError('');

    try {
      await loadSnapScript();
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          payment_method: 'qris',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.snap_token) {
        throw new Error(data.error || 'Gagal membuat sesi pembayaran Midtrans.');
      }

      if (window.snap && typeof window.snap.pay === 'function') {
        window.snap.pay(data.snap_token, {
          onSuccess: (result: any) => {
            console.log('Payment success:', result);
            fetchLiveOrder();
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            fetchLiveOrder();
          },
          onError: (result: any) => {
            console.error('Payment error:', result);
            setPaymentError('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            console.log('Payment popup closed.');
            fetchLiveOrder();
          },
        });
      }
    } catch (err: any) {
      console.error('Midtrans trigger error:', err);
      setPaymentError(err.message || 'Gagal membuka pembayaran Midtrans.');
    } finally {
      setIsOpeningSnap(false);
    }
  };

  // Live order fetcher from real-time API with cache buster
  const fetchLiveOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders?status=ALL&t=${Date.now()}`, { cache: 'no-store' });
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

    // 1. Supabase Realtime Channel for instant push updates (<100ms)
    let channel: any = null;
    try {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        channel = supabase
          .channel(`order_live_${orderId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders' },
            (payload) => {
              if (payload.new && (payload.new.id === orderId || payload.new.tracking_secret === secret)) {
                setOrder((prev: any) => ({ ...prev, ...payload.new }));
              }
              fetchLiveOrder();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              fetchLiveOrder();
            }
          });
      });
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }

    // 2. Slow Heartbeat Polling (15 seconds) as fallback safety net
    const interval = setInterval(fetchLiveOrder, 15000);

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.removeChannel(channel);
          });
        } catch (e) {}
      }
    };
  }, [orderId, uploadSuccess, secret]);

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Format file tidak didukung. Harap pilih foto bertipe JPG, PNG, atau WebP.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar. Maksimal ukuran file adalah 5 MB.');
        e.target.value = '';
        return;
      }

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

  const isPreparing = currentOrderStatus === 'PREPARING' || currentOrderStatus === 'READY' || currentOrderStatus === 'DELIVERING' || currentOrderStatus === 'COMPLETED';
  const isReady = currentOrderStatus === 'READY' || currentOrderStatus === 'DELIVERING' || currentOrderStatus === 'COMPLETED';
  const isDelivering = currentOrderStatus === 'DELIVERING';
  const isCompleted = currentOrderStatus === 'COMPLETED';

  return (
    <main style={{ minHeight: '100vh', background: '#070605', color: '#F7F4EF', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Back to Home */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#C29B7F', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Katalog Menu</span>
        </Link>

        {/* DELIVERING / SEDANG DIANTAR WAITER BANNER ALERT */}
        {isDelivering && (
          <div
            style={{
              background: 'rgba(230, 126, 34, 0.15)',
              border: '1.5px solid #E67E22',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 0 20px rgba(230, 126, 34, 0.25)',
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E67E22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Coffee size={24} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E67E22', fontWeight: 800 }}>PRAMUSAJI / FLOOR RUNNER</span>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800, margin: '0.1rem 0 0.2rem 0' }}>
                PESANAN SEDANG DIANTAR KE MEJA
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#F3EFEA', margin: 0 }}>
                Waiter KOPIMAGE sedang membawa pesananmu menuju meja. Harap bersiap!
              </p>
            </div>
          </div>
        )}

        {/* READY / SIAP DISAJIKAN GLOWING BANNER ALERT */}
        {currentOrderStatus === 'READY' && (
          <div
            style={{
              background: 'rgba(39, 174, 96, 0.15)',
              border: '1px solid #27AE60',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={24} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#27AE60', fontWeight: 800 }}>STASIUN KITCHEN NOTIFIKASI</span>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800, margin: '0.1rem 0 0.2rem 0' }}>
                PESANAN SIAP DI PICKUP COUNTER
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#C4BBB4', margin: 0 }}>
                Pesananmu sudah selesai diracik dan segera diambil oleh waiter.
              </p>
            </div>
          </div>
        )}

        {/* COMPLETED BANNER ALERT */}
        {isCompleted && (
          <div
            style={{
              background: 'rgba(39, 174, 96, 0.12)',
              border: '1px solid #27AE60',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <CheckCircle size={20} color="#27AE60" />
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#27AE60', fontWeight: 800, margin: 0 }}>
                Pesanan Telah Selesai Disajikan 100%
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#A89F91' }}>Selamat menikmati hidangan racikan KOPIMAGE.</span>
            </div>
          </div>
        )}

        {/* Order Header Card */}
        <div style={{ borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#A89F91', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>Nomor Pesanan</span>
              <h2 style={{ fontSize: '1.5rem', color: '#F7F4EF', fontWeight: 800, margin: '0.2rem 0' }}>{order.order_number}</h2>
              <span style={{ fontSize: '0.85rem', color: '#C29B7F', fontWeight: 600 }}>
                {order.mode === 'takeaway'
                  ? 'TAKEAWAY (Dibawa Pulang)'
                  : `Dine-In • MEJA ${
                      order.table_code ||
                      (order.tables?.code && !order.tables.code.includes('-') ? order.tables.code : null) ||
                      (order.table_id && !String(order.table_id).includes('-') ? order.table_id : '01')
                    }`}
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

        {/* 1. MIDTRANS ONLINE PAYMENT CARD (QRIS / E-WALLET / VA) */}
        {currentPaymentStatus !== 'PAID' && (order.payment_method === 'midtrans_online' || order.payment_method === 'qris') && (
          <div style={{ borderRadius: '24px', padding: '1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1A1412 0%, #0E0C0A 100%)', border: '1.5px solid rgba(46, 204, 113, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(46, 204, 113, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} color="#2ECC71" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 800, margin: 0 }}>
                    Pembayaran Online Instan
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#2ECC71', fontWeight: 700, fontFamily: 'monospace' }}>
                    MIDTRANS SNAP (QRIS / GOPAY / VA)
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(46, 204, 113, 0.2)', color: '#2ECC71', border: '1px solid #2ECC71' }}>
                OTOMATIS
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#A89F91', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Total tagihan pesanan Anda: <strong style={{ color: '#2ECC71', fontSize: '1.05rem', fontFamily: 'monospace' }}>Rp {(order.subtotal || order.total_amount || 47000)?.toLocaleString('id-ID')}</strong>. Klik tombol di bawah untuk membuka popup pembayaran.
            </p>

            {paymentError && (
              <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.4)', padding: '0.65rem 1rem', borderRadius: '10px', color: '#E74C3C', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{paymentError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePayWithMidtrans}
              disabled={isOpeningSnap}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: isOpeningSnap ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 20px rgba(39, 174, 96, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Zap size={18} />
              <span>{isOpeningSnap ? 'Menghubungkan ke Midtrans...' : 'Buka QRIS / Bayar Sekarang'}</span>
            </button>
          </div>
        )}

        {/* 2. CASHIER INSTRUCTION CARD */}
        {currentPaymentStatus !== 'PAID' && order.payment_method === 'cashier' && (
          <div style={{ borderRadius: '24px', padding: '1.5rem', marginBottom: '1.5rem', background: '#161210', border: '1.5px solid rgba(212, 163, 115, 0.4)' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#F7F4EF', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coffee size={18} color="#D4A373" />
              <span>Instruksi Bayar di Kasir</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#A89F91', margin: 0, lineHeight: 1.5 }}>
              Pesanan Anda telah masuk antrean dapur. Silakan lakukan pembayaran sebesar <strong style={{ color: '#D4A373' }}>Rp {(order.subtotal || order.total_amount || 47000)?.toLocaleString('id-ID')}</strong> secara tunai atau EDC di kasir saat pesanan disajikan.
            </p>
          </div>
        )}

        {/* 3. MANUAL QRIS / BANK TRANSFER UPLOAD (Jika Menggunakan Manual Flow) */}
        {currentPaymentStatus !== 'PAID' && (order.payment_method === 'qris_static' || order.payment_method === 'bank_transfer') && (
          <div style={{ borderRadius: '24px', padding: '1.75rem', marginBottom: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} color="#C29B7F" />
              <span>Instruksi Pembayaran QRIS / Bank Manual</span>
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
        <div style={{ borderRadius: '24px', padding: '1.75rem', marginBottom: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
                <div style={{ fontSize: '0.92rem', color: isPreparing ? '#25D366' : '#F7F4EF', fontWeight: 800 }}>2. Diproses Barista &amp; Dapur (PREPARING)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Barista &amp; dapur lagi meracik hidangan favoritmu</div>
              </div>
            </div>

            {/* STEP 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isReady ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isReady ? 'rgba(37, 211, 102, 0.2)' : 'transparent', border: isReady ? '2px solid #25D366' : '2px solid #A89F91', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isReady ? <CheckCircle size={16} color="#25D366" /> : <Clock size={16} color="#A89F91" />}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: isReady ? '#25D366' : '#F7F4EF', fontWeight: 800 }}>3. Siap di Pickup Counter (READY)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Pesanan selesai dan siap diambil waiter</div>
              </div>
            </div>

            {/* STEP 4 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isDelivering || isCompleted ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDelivering || isCompleted ? 'rgba(230, 126, 34, 0.2)' : 'transparent', border: isDelivering || isCompleted ? '2px solid #E67E22' : '2px solid #A89F91', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDelivering || isCompleted ? <CheckCircle size={16} color="#E67E22" /> : <Clock size={16} color="#A89F91" />}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: isDelivering || isCompleted ? '#E67E22' : '#F7F4EF', fontWeight: 800 }}>4. Sedang Diantar Waiter (DELIVERING)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Waiter sedang membawakan pesanan ke mejamu</div>
              </div>
            </div>

            {/* STEP 5 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isCompleted ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCompleted ? 'rgba(37, 211, 102, 0.2)' : 'transparent', border: isCompleted ? '2px solid #25D366' : '2px solid #A89F91', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCompleted ? <CheckCircle size={16} color="#25D366" /> : <Clock size={16} color="#A89F91" />}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: isCompleted ? '#25D366' : '#F7F4EF', fontWeight: 800 }}>5. Selesai Disajikan (COMPLETED)</div>
                <div style={{ fontSize: '0.78rem', color: '#A89F91' }}>Selamat menikmati racikan KOPIMAGE!</div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER WAITER CALL / QUICK SERVICE CARD (Phase 4) */}
        {order.mode !== 'takeaway' && (
          <CustomerWaiterCallSection
            tableCode={
              order.table_code ||
              (order.tables?.code && !order.tables.code.includes('-') ? order.tables.code : null) ||
              (order.table_id && !String(order.table_id).includes('-') ? order.table_id : '01')
            }
          />
        )}

      </div>
    </main>
  );
}

// Sub-component for Customer Waiter Call Controls
function CustomerWaiterCallSection({ tableCode }: { tableCode: string }) {
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fetchTableRequests = async () => {
    try {
      const res = await fetch(`/api/waiter/requests?table_code=${tableCode}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        // Only active requests (OPEN or HANDLED)
        const active = data.requests.filter((r: any) => r.status !== 'COMPLETED');
        setActiveRequests(active);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchTableRequests();

    // 1. Supabase Realtime Listener for table waiter requests
    let channel: any = null;
    try {
      import('@/lib/supabase/client').then(({ createClient }) => {
        const supabase = createClient();
        channel = supabase
          .channel(`customer_table_requests_${tableCode}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'waiter_requests' },
            (payload: any) => {
              if (payload.new && String(payload.new.table_code) === String(tableCode)) {
                fetchTableRequests();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              fetchTableRequests();
            }
          });
      });
    } catch (e) {
      console.warn('Customer requests realtime error:', e);
    }

    // 2. Slow Heartbeat Polling (15 seconds)
    const interval = setInterval(fetchTableRequests, 15000);

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.removeChannel(channel);
          });
        } catch (e) {}
      }
    };
  }, [tableCode]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleCallWaiter = async (type: 'BANTUAN' | 'BILL') => {
    setSubmittingType(type);
    try {
      const res = await fetch('/api/waiter/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_code: tableCode,
          request_type: type,
          notes: type === 'BILL' ? `Customer Meja ${tableCode} meminta bill pembayaran.` : `Customer Meja ${tableCode} memanggil waiter untuk bantuan.`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.isDuplicate) {
          setToastMessage({ type: 'info', text: 'Permintaan bantuan Anda sudah ada dalam antrean staf.' });
        } else {
          setToastMessage({ type: 'success', text: 'Panggilan terkirim! Staf waiter segera menuju mejamu.' });
        }
        fetchTableRequests();
      } else {
        setToastMessage({ type: 'error', text: data.error || 'Gagal mengirim panggilan.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: 'Koneksi bermasalah: ' + err.message });
    } finally {
      setSubmittingType(null);
    }
  };

  const hasActiveBantuan = activeRequests.some((r) => r.request_type === 'BANTUAN');
  const hasActiveBill = activeRequests.some((r) => r.request_type === 'BILL');

  return (
    <div style={{ borderRadius: '24px', padding: '1.5rem', background: '#0E0C0A', border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastMessage.type === 'success' ? '#27AE60' : toastMessage.type === 'info' ? '#F39C12' : '#E74C3C',
            color: '#FFFFFF',
            padding: '0.4rem 1rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#C29B7F', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
            LAYANAN MEJA {tableCode}
          </span>
          <h3 style={{ fontSize: '1.1rem', color: '#F7F4EF', fontWeight: 700, margin: '0.1rem 0 0 0' }}>
            Butuh Bantuan dari Waiter?
          </h3>
        </div>
      </div>

      {/* Active Requests Banner */}
      {activeRequests.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activeRequests.map((req) => (
            <div
              key={req.id}
              style={{
                background: req.status === 'HANDLED' ? 'rgba(39, 174, 96, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                border: req.status === 'HANDLED' ? '1px solid #27AE60' : '1px solid #F1C40F',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: req.status === 'HANDLED' ? '#2ECC71' : '#F1C40F', fontWeight: 800, fontFamily: 'monospace' }}>
                  {req.request_type === 'BILL' ? '🧾 MINTA BILL' : '🙋‍♂️ PANGGIL WAITER'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#A89F91' }}>
                  {req.status === 'HANDLED' ? '• Staf sedang menuju meja' : '• Menunggu staf'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  background: req.status === 'HANDLED' ? '#27AE60' : '#F1C40F',
                  color: req.status === 'HANDLED' ? '#FFFFFF' : '#070605',
                }}
              >
                {req.status === 'HANDLED' ? 'SEDANG DITANGANI' : 'DALAM ANTREAN'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button
          onClick={() => handleCallWaiter('BANTUAN')}
          disabled={submittingType === 'BANTUAN' || hasActiveBantuan}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            background: hasActiveBantuan ? '#161210' : '#1A1412',
            border: hasActiveBantuan ? '1px solid rgba(241, 196, 15, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: hasActiveBantuan ? '#F1C40F' : '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 800,
            fontFamily: 'monospace',
            cursor: hasActiveBantuan ? 'not-allowed' : 'pointer',
            opacity: hasActiveBantuan ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <span>{submittingType === 'BANTUAN' ? 'Mengirim...' : hasActiveBantuan ? '✓ Bantuan Dipanggil' : '🙋‍♂️ Panggil Waiter'}</span>
        </button>

        <button
          onClick={() => handleCallWaiter('BILL')}
          disabled={submittingType === 'BILL' || hasActiveBill}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            background: hasActiveBill ? '#161210' : '#1A1412',
            border: hasActiveBill ? '1px solid rgba(230, 126, 34, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: hasActiveBill ? '#E67E22' : '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 800,
            fontFamily: 'monospace',
            cursor: hasActiveBill ? 'not-allowed' : 'pointer',
            opacity: hasActiveBill ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s',
          }}
        >
          <span>{submittingType === 'BILL' ? 'Mengirim...' : hasActiveBill ? '✓ Bill Diminta' : '🧾 Minta Bill'}</span>
        </button>
      </div>
    </div>
  );
}

