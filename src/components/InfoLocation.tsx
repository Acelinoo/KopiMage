import React from 'react';
import { MapPin, Clock, Phone, Instagram, Coffee, ExternalLink, MessageCircle } from 'lucide-react';

export const InfoLocation: React.FC = () => {
  const mapsUrl = "https://maps.google.com/?q=Gading+Tutuka+Soreang+KopiMage";
  const whatsappUrl = "https://wa.me/6281313432001?text=Halo%20KOPIMAGE,%20saya%20mau%20tanya%20informasi/pesan";
  const instagramUrl = "https://instagram.com/kopimage";

  return (
    <section id="location" style={{ padding: '5rem 0', background: 'var(--bg-secondary)', position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#D4A373', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Kunjungi &amp; Kontak Kami
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#F7F4EF', marginTop: '0.4rem', marginBottom: '0.75rem' }}>
            Lokasi &amp; Jam Operasional
          </h2>
          <p style={{ color: '#C4BBB4', maxWidth: '580px', margin: '0 auto' }}>
            Kami siap menyambut Anda setiap hari untuk momen ngopi, kerja santai, dan kumpul hangat di Soreang.
          </p>
        </div>

        {/* Info Grid Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.75rem',
            alignItems: 'stretch'
          }}
        >
          {/* Card 1: Lokasi */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(212, 163, 115, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <MapPin size={24} color="#D4A373" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.6rem' }}>Alamat Kedai</h3>
              <p style={{ color: '#C4BBB4', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                <strong>Gading Tutuka, Soreang</strong><br />
                Kabupaten Bandung, Jawa Barat
              </p>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ExternalLink size={16} />
              <span>Buka Petunjuk Google Maps</span>
            </a>
          </div>

          {/* Card 2: Jam Operasional */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(198, 125, 90, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Clock size={24} color="#C67D5A" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.6rem' }}>Jam Operasional</h3>
              <div style={{ color: '#C4BBB4', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                  <span>Senin - Minggu</span>
                  <strong style={{ color: '#F7F4EF' }}>07.00 - 23.00 WIB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem' }}>
                  <span>Status Hari Ini</span>
                  <span style={{ color: '#25D366', fontWeight: 600 }}>● Buka Setiap Hari</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#8E847C', textAlign: 'center' }}>
              Melayani Dine-in, Takeaway, &amp; Pesanan Literan
            </div>
          </div>

          {/* Card 3: Kontak & Sosmed */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <MessageCircle size={24} color="#25D366" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.6rem' }}>Kontak &amp; Social</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#C4BBB4', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Phone size={18} color="#25D366" />
                  <span>WhatsApp: <strong>081313432001</strong></span>
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#C4BBB4', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  <Instagram size={18} color="#E1306C" />
                  <span>Instagram: <strong>@kopimage</strong></span>
                </a>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
