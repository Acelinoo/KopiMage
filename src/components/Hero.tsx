import React from 'react';
import { Coffee, Clock, MapPin, Sparkles, ChevronDown } from 'lucide-react';

export const Hero: React.FC = () => {
  const whatsappUrl = "https://wa.me/6281313432001?text=Halo%20KOPIMAGE,%20saya%20mau%20pesan%20menu";

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '92vh',
        paddingTop: '8.5rem',
        paddingBottom: '4rem',
        display: 'flex',
        alignItems: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(198, 125, 90, 0.15) 0%, rgba(15, 13, 12, 0) 70%)',
        overflow: 'hidden'
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>

          {/* Top Pill Badge */}
          <div
            className="animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(212, 163, 115, 0.12)',
              border: '1px solid rgba(212, 163, 115, 0.3)',
              color: '#D4A373',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.75rem'
            }}
          >
            <Sparkles size={16} />
            <span>Coffee, Eats & Good Times di Soreang</span>
          </div>

          {/* Main Hero Heading */}
          <h1
            className="animate-fade-in"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: '#F7F4EF'
            }}
          >
            Nikmati Kopi Pilihan & Kuliner Khas di <span style={{ background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOPIMAGE</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-in"
            style={{
              fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
              color: '#C4BBB4',
              lineHeight: 1.6,
              marginBottom: '2.25rem',
              maxWidth: '660px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Dari racikan kopi murni, Es Kopi Susu signature, hingga sajian cemilan &amp; makanan berat lezat. Tempat pas buat nongkrong, kerja, dan bersantai di Gading Tutuka.
          </p>

          {/* Quick Info Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              marginBottom: '2.5rem',
              fontSize: '0.88rem',
              color: '#F7F4EF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(30, 26, 23, 0.7)', padding: '0.45rem 1rem', borderRadius: '9999px', border: '1px solid rgba(212, 163, 115, 0.2)' }}>
              <MapPin size={15} color="#D4A373" />
              <span>Gading Tutuka, Soreang</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(30, 26, 23, 0.7)', padding: '0.45rem 1rem', borderRadius: '9999px', border: '1px solid rgba(212, 163, 115, 0.2)' }}>
              <Clock size={15} color="#D4A373" />
              <span>Buka Setiap Hari: 07.00 - 23.00 WIB</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <a href="#menu" className="btn btn-primary" style={{ padding: '0.95rem 2rem' }}>
              <Coffee size={18} />
              <span>Jelajahi Menu Interaktif</span>
            </a>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ padding: '0.95rem 1.8rem' }}>
              <span>Pesan Langsung via WA</span>
            </a>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Arrow Anchor */}
      <a
        href="#menu"
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--text-muted)',
          transition: 'color 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          fontSize: '0.78rem'
        }}
      >
        <span style={{ marginBottom: '0.2rem' }}>Lihat Daftar Menu</span>
        <ChevronDown size={18} />
      </a>
    </section>
  );
};
