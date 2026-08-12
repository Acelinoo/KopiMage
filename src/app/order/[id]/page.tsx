'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Coffee, Clock, CheckCircle, Upload, QrCode, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    // Simulated realtime order status fetch
    const fetchOrder = () => {
      setOrder({
        id: orderId,
        order_number: `KOP-20260812-${orderId ? orderId.slice(0, 3).toUpperCase() : '007'}`,
        mode: 'dine-in',
        table_id: '07',
        customer_name: 'Customer KOPIMAGE',
        subtotal: 47000,
        payment_method: 'qris_static',
        payment_status: uploadSuccess ? 'VERIFYING' : 'UNPAID',
        order_status: 'NEW_ORDER',
        created_at: new Date().toISOString(),
      });
      setLoading(false);
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId, uploadSuccess]);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploadSuccess(true);
      }, 1500);
    }
  };

  if (loading) {
    style: return (
      <div style={{ minHeight: '100vh', background: '#0F0D0C', color: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Memuat status pesanan...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0F0D0C', color: '#F7F4EF', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Back to Home */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#D4A373', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Menu Utama</span>
        </Link>

        {/* Order Header Card */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', background: '#161311', border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#8E847C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nomor Pesanan</span>
              <h2 style={{ fontSize: '1.6rem', color: '#F7F4EF', fontWeight: 800, margin: '0.2rem 0' }}>{order.order_number}</h2>
              <span style={{ fontSize: '0.85rem', color: '#D4A373', fontWeight: 600 }}>
                {order.mode === 'dine-in' ? `Dine-In • Meja ${order.table_id || '-'}` : 'Takeaway (Dibawa Pulang)'}
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coffee size={20} color="#0F0D0C" />
            </div>
          </div>

          {/* Dual Status Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: 'rgba(30, 26, 23, 0.8)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 163, 115, 0.12)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#8E847C', display: 'block', marginBottom: '0.2rem' }}>Status Produksi:</span>
              <span className="badge badge-bestseller" style={{ fontSize: '0.8rem' }}>
                <Clock size={12} /> {order.order_status}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#8E847C', display: 'block', marginBottom: '0.2rem' }}>Status Pembayaran:</span>
              <span className="badge badge-seasonal" style={{ fontSize: '0.8rem', background: order.payment_status === 'PAID' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: order.payment_status === 'PAID' ? '#25D366' : '#E74C3C' }}>
                <ShieldCheck size={12} /> {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* QRIS / Transfer Payment Section */}
        {order.payment_status !== 'PAID' && order.payment_method !== 'cashier' && (
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', background: '#161311' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} color="#D4A373" />
              <span>Instruksi Pembayaran QRIS / Bank</span>
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#C4BBB4', marginBottom: '1.25rem' }}>
              Silakan melakukan pembayaran sebesar <strong style={{ color: '#D4A373' }}>Rp {order.subtotal?.toLocaleString('id-ID')}</strong> ke QRIS atau rekening resmi KOPIMAGE.
            </p>

            <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', width: '180px', margin: '0 auto 1.25rem auto' }}>
              <div style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, marginBottom: '0.4rem' }}>QRIS KOPIMAGE</div>
              <div style={{ width: '140px', height: '140px', background: '#F4F4F4', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #000' }}>
                <QrCode size={100} color="#000" />
              </div>
            </div>

            {/* Proof Upload Area */}
            <div style={{ background: 'rgba(30, 26, 23, 0.9)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(212, 163, 115, 0.3)', textAlign: 'center' }}>
              <Upload size={24} color="#D4A373" style={{ marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '0.2rem' }}>
                {uploadSuccess ? 'Bukti Bayar Berhasil Diunggah' : 'Unggah Foto Bukti Transfer'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#8E847C', display: 'block', marginBottom: '0.85rem' }}>
                {uploadSuccess ? 'Menunggu verifikasi admin KOPIMAGE.' : 'Format: JPG, PNG, WebP (Maks 5MB)'}
              </span>

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <span>{uploading ? 'Mengunggah...' : uploadSuccess ? 'Unggah Ulang Bukti' : 'Pilih File Foto'}</span>
                <input type="file" accept="image/*" onChange={handleSimulatedUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* Live Order Timeline */}
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '1.75rem', background: '#161311' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', fontWeight: 700, marginBottom: '1.25rem' }}>
            Tahapan Pengerjaan Pesanan
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle size={20} color="#25D366" />
              <div>
                <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>1. Pesanan Diterima (NEW_ORDER)</div>
                <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Pesanan masuk ke sistem antrian KOPIMAGE</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Clock size={20} color="#D4A373" />
              <div>
                <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>2. Diproses Barista (PREPARING)</div>
                <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Barista & dapur sedang meracik hidangan Anda</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5 }}>
              <CheckCircle size={20} color="#8E847C" />
              <div>
                <div style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 700 }}>3. Siap Dihidangkan (READY)</div>
                <div style={{ fontSize: '0.78rem', color: '#8E847C' }}>Pesanan siap diambil di counter / diantar ke meja</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
