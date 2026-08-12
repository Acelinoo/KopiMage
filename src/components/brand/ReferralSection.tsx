'use client';

import React, { useState } from 'react';
import { Gift, Share2, Copy, Check, Users, Sparkles, ArrowRight } from 'lucide-react';

export const ReferralSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=KOPIMAGE-SOREANG` : 'https://kopimage.co.id/?ref=KOPIMAGE-SOREANG';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Yuk nongkrong bareng di KOPIMAGE Soreang! Dapatkan diskon spesial racikan kopi & kuliner khas dengan scan QR dari link ini: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <section id="referral" style={{ padding: '9rem 0', background: '#0F0D0C', borderTop: '1px solid rgba(212, 163, 115, 0.12)', borderBottom: '1px solid rgba(212, 163, 115, 0.12)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Ambient Radial Background */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '500px', background: 'radial-gradient(circle, rgba(212, 163, 115, 0.1) 0%, rgba(198, 125, 90, 0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 4rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.1rem',
              borderRadius: '9999px',
              background: 'rgba(212, 163, 115, 0.15)',
              border: '1px solid rgba(212, 163, 115, 0.4)',
              color: '#D4A373',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            <Gift size={16} />
            <span>KOPIMAGE Referral Circle</span>
          </div>

          <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', fontWeight: 800, color: '#F7F4EF', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Bagikan Momen Hangat, <br />
            <span style={{ background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dapatkan Reward Eksklusif.
            </span>
          </h2>

          <p style={{ fontSize: '1.08rem', color: '#C4BBB4', lineHeight: 1.7, margin: 0 }}>
            Nongkrong beramai-ramai selalu lebih seru. Ajak teman atau komunitasmu menikmati racikan kopi khas Soreang dan dapatkan potongan <strong style={{ color: '#D4A373' }}>Diskon 15%</strong> untuk kunjungan kalian berikutnya.
          </p>
        </div>

        {/* Interactive Referral Card */}
        <div
          style={{
            maxWidth: '920px',
            margin: '0 auto 5rem auto',
            background: 'linear-gradient(135deg, #1E1A17 0%, #161311 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(212, 163, 115, 0.25)',
            padding: '3rem 2.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left Info */}
            <div style={{ gridColumn: 'span 7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#D4A373', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                <Sparkles size={16} />
                <span>LINK REFERRAL SAHABAT KOPIMAGE</span>
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F7F4EF', marginBottom: '0.85rem' }}>
                Undang Teman &amp; Nikmati Kopi Bersama
              </h3>

              <p style={{ fontSize: '0.95rem', color: '#C4BBB4', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                Salin tautan unik milikmu di bawah ini atau bagikan langsung ke grup WhatsApp nongkrongmu. Setiap scan QR via link ini otomatis mengaktifkan reward referral.
              </p>

              {/* Copy Link Input Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0F0D0C',
                  border: '1px solid rgba(212, 163, 115, 0.3)',
                  borderRadius: '9999px',
                  padding: '0.4rem 0.4rem 0.4rem 1.25rem',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '0.88rem', color: '#D4A373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'monospace', fontWeight: 600 }}>
                  {referralLink}
                </span>

                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#25D366' : 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
                    color: copied ? '#000' : '#0F0D0C',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>
            </div>

            {/* Right WhatsApp Quick Action */}
            <div
              style={{
                gridColumn: 'span 5',
                background: '#0F0D0C',
                padding: '2rem 1.5rem',
                borderRadius: '18px',
                border: '1px solid rgba(212, 163, 115, 0.15)',
                textAlign: 'center',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Share2 size={22} color="#25D366" />
              </div>

              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F7F4EF', marginBottom: '0.5rem' }}>
                Bagikan Instan ke WhatsApp
              </h4>

              <p style={{ fontSize: '0.85rem', color: '#8E847C', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Kirim langsung pesan ajakan nongkrong ke teman atau kontak WhatsApp.
              </p>

              <button
                onClick={handleShareWhatsApp}
                className="btn btn-whatsapp"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
              >
                <Share2 size={16} />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>

          </div>
        </div>

        {/* 3 Step Process */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: '920px', margin: '0 auto' }}>
          
          <div style={{ background: '#161311', padding: '1.8rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(212,163,115,0.12)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212,163,115,0.15)', color: '#D4A373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
              1
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.35rem' }}>Bagikan Link Referral</h4>
            <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0, lineHeight: 1.6 }}>Kirim tautan unik KOPIMAGE ke teman, keluarga, atau grup komunitasmu.</p>
          </div>

          <div style={{ background: '#161311', padding: '1.8rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(212,163,115,0.12)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212,163,115,0.15)', color: '#D4A373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
              2
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.35rem' }}>Datang &amp; Scan QR Meja</h4>
            <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0, lineHeight: 1.6 }}>Temanmu memindai QR code di meja KOPIMAGE Soreang untuk melakukan pemesanan.</p>
          </div>

          <div style={{ background: '#161311', padding: '1.8rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(212,163,115,0.12)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(212,163,115,0.15)', color: '#D4A373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
              3
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.35rem' }}>Klaim Reward Diskon 15%</h4>
            <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0, lineHeight: 1.6 }}>Kalian berdua otomatis mendapatkan voucher reward potongan harga saat checkout.</p>
          </div>

        </div>

      </div>
    </section>
  );
};
