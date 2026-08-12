'use client';

import React, { useState, useEffect } from 'react';
import { Coffee, ShieldCheck, Check, X, Eye, ToggleLeft, ToggleRight, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'menu' | 'tables'>('verification');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Stock Availability State
  const [menuItemsState, setMenuItemsState] = useState<any[]>([]);
  // Tables State
  const [tablesState, setTablesState] = useState<any[]>([]);

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

        // Generate Signed URLs for each order with payment_proof_url
        const urlsMap: Record<string, string> = {};
        for (const order of ordersData) {
          if (order.payment_proof_url) {
            // Clean filename if path includes bucket prefix
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

  const handleRejectPayment = async (orderId: string) => {
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ payment_status: 'REJECTED' }).eq('id', orderId);
      setPendingPayments((prev) => prev.filter((p) => p.id !== orderId));
    } catch (err) {
      console.error('Reject failed:', err);
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

  return (
    <main style={{ minHeight: '100vh', background: '#0F0D0C', color: '#F7F4EF', padding: '2rem 1.5rem' }}>
      <div className="container">
        
        {/* Admin Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(212, 163, 115, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="#0F0D0C" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>Admin Operations Center</h1>
              <span style={{ fontSize: '0.85rem', color: '#D4A373', fontWeight: 600 }}>KOPIMAGE Soreang • Full System Dashboard</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={fetchAdminData} className="btn btn-secondary btn-sm" title="Refresh Data">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={activeTab === 'verification' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              <span>Verifikasi Bukti ({pendingPayments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={activeTab === 'menu' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              <span>Kelola Menu &amp; Stok</span>
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={activeTab === 'tables' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              <span>Kelola Meja</span>
            </button>
          </div>
        </header>

        {/* Tab 1: Payment Verification Queue */}
        {activeTab === 'verification' && (
          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '1.25rem' }}>
              Antrian Verifikasi Pembayaran QRIS / Transfer
            </h2>

            {loading ? (
              <p style={{ color: '#C4BBB4' }}>Memuat antrian verifikasi...</p>
            ) : pendingPayments.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', borderRadius: 'var(--radius-lg)' }}>
                <Check size={48} color="#25D366" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#F7F4EF' }}>Tidak Ada Bukti Bayar Pending</h3>
                <p style={{ color: '#8E847C', fontSize: '0.9rem' }}>Semua pembayaran transfer/QRIS telah diverifikasi.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {pendingPayments.map((p) => {
                  const proofSignedUrl = signedUrls[p.id];

                  return (
                    <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: '#161311', border: '1px solid var(--border-active)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F7F4EF' }}>{p.order_number}</span>
                        <span style={{ fontSize: '0.8rem', color: '#E67E22', background: 'rgba(230,126,34,0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
                          {p.payment_status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#C4BBB4', marginBottom: '1rem', lineHeight: 1.6 }}>
                        Pemesan: <strong style={{ color: '#F7F4EF' }}>{p.customer_name}</strong><br />
                        Total: <strong style={{ color: '#D4A373' }}>Rp {p.subtotal?.toLocaleString('id-ID')}</strong><br />
                        Metode: <span style={{ textTransform: 'uppercase', color: '#8E847C' }}>{p.payment_method}</span>
                      </div>

                      {/* Signed URL Proof Image Container */}
                      <div style={{ background: 'rgba(30, 26, 23, 0.9)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(212,163,115,0.3)', textAlign: 'center', marginBottom: '1.25rem' }}>
                        {proofSignedUrl ? (
                          <div>
                            <img
                              src={proofSignedUrl}
                              alt="Bukti Transfer"
                              style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', cursor: 'pointer', marginBottom: '0.5rem' }}
                              onClick={() => setSelectedImageModal(proofSignedUrl)}
                            />
                            <a
                              href={proofSignedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#D4A373', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <ExternalLink size={14} />
                              <span>Buka Gambar Asli (Ukuran Penuh)</span>
                            </a>
                          </div>
                        ) : (
                          <div>
                            <Eye size={20} color="#D4A373" style={{ marginBottom: '0.3rem' }} />
                            <div style={{ fontSize: '0.8rem', color: '#C4BBB4' }}>Tidak ada foto bukti terlampir</div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleApprovePayment(p.id)}
                          className="btn btn-whatsapp btn-sm"
                          style={{ justifyContent: 'center' }}
                        >
                          <Check size={16} />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ justifyContent: 'center', borderColor: '#E74C3C', color: '#E74C3C' }}
                        >
                          <X size={16} />
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

        {/* Tab 2: Menu Stock Toggle (is_available) */}
        {activeTab === 'menu' && (
          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '1.25rem' }}>
              Kontrol Ketersediaan Stok Menu (Real-time is_available Toggle)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {menuItemsState.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: '#161311', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#F7F4EF', margin: 0 }}>{item.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: '#D4A373' }}>Rp {item.base_price?.toLocaleString('id-ID')}</span>
                  </div>

                  <button
                    onClick={() => toggleStock(item.id, item.is_available)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: item.is_available !== false ? '#25D366' : '#8E847C',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.is_available !== false ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    <span>{item.is_available !== false ? 'Tersedia' : 'Habis'}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Tables Registry Control */}
        {activeTab === 'tables' && (
          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '1.25rem' }}>
              Manajemen Registry Meja Kedai (Aktif / Non-Aktif)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {tablesState.map((t) => (
                <div key={t.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: '#161311', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F7F4EF' }}>{t.name} (Kode: {t.code})</div>
                    <span style={{ fontSize: '0.8rem', color: '#8E847C' }}>Area: {t.area}</span>
                  </div>

                  <button
                    onClick={() => toggleTable(t.id, t.is_active)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: t.is_active ? '#25D366' : '#E74C3C',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {t.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Image Full Modal */}
      {selectedImageModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setSelectedImageModal(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={selectedImageModal} alt="Bukti Transfer Penuh" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
            <button
              onClick={() => setSelectedImageModal(null)}
              style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#E74C3C', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
