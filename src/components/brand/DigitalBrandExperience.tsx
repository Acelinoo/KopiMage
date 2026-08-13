'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, ArrowRight, QrCode, Sparkles, Coffee } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const DigitalBrandExperience: React.FC = () => {
  const heroImage = '/images/kopimage_hero_atmosphere_1786480906850.webp';
  const pouringImage = '/images/kopimage_barista_pouring_1786480929425.webp';
  const foodImage = '/images/kopimage_food_table_1786480947275.webp';
  const spaceImage = '/images/kopimage_space_terrace_1786480961312.webp';

  return (
    <div style={{ background: '#0F0D0C', color: '#F7F4EF', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      
      {/* 1. Header Minimalis */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(15,13,12,0.96) 0%, rgba(15,13,12,0) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={20} color="#0F0D0C" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', lineHeight: 1, color: '#F7F4EF' }}>
              KOPIMAGE
            </span>
            <span style={{ fontSize: '0.65rem', color: '#D4A373', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
              Soreang • Gading Tutuka
            </span>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-6 md:gap-8">
          <a href="#story" className="link-underline text-sm font-medium text-[#C4BBB4]">
            Story
          </a>
          <a href="#experience" className="link-underline text-sm font-medium text-[#C4BBB4]">
            Experience
          </a>
          <a href="#space" className="link-underline text-sm font-medium text-[#C4BBB4]">
            The Space
          </a>
          <a
            href="#location"
            className="btn btn-primary btn-sm px-5 py-2 text-xs sm:text-sm font-semibold"
          >
            <span>Temukan KOPIMAGE</span>
            <ArrowRight size={14} />
          </a>
        </nav>
      </header>

      {/* 2. Opening / Hero — Massive Photography & Smooth Reveal */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', paddingBottom: '6rem', paddingTop: '8rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          <Image
            src={heroImage}
            alt="KOPIMAGE Soreang Atmosphere"
            fill
            priority
            style={{ objectFit: 'cover', filter: 'brightness(0.68) contrast(1.05)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,13,12,0.4) 0%, rgba(15,13,12,0.85) 85%, #0F0D0C 100%)' }} />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <ScrollReveal variant="fade-up" delay={100}>
            <div style={{ maxWidth: '820px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#D4A373', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                <Sparkles size={16} />
                <span>Gading Tutuka • Soreang</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#F7F4EF',
                  marginBottom: '1.5rem',
                }}
              >
                Ruang Singgah, Kopi Pilihan, &amp; Momen Hangat.
              </h1>

              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: '#C4BBB4', lineHeight: 1.6, maxWidth: '640px', marginBottom: '2.5rem', fontWeight: 400 }}>
                Dari racikan espresso murni, Es Kopi Susu signature, hingga santapan khas yang menemani jam nongkrong dan santaimu di Soreang.
              </p>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href="#location"
                  style={{
                    background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
                    color: '#0F0D0C',
                    padding: '0.9rem 2rem',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 8px 32px rgba(212, 163, 115, 0.25)',
                  }}
                >
                  <span>Datang &amp; Nikmati</span>
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#qr-guide"
                  style={{
                    color: '#F7F4EF',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <QrCode size={18} color="#D4A373" />
                  <span>Pesan dari Meja via QR</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Brand Statement — Scroll Reveal Big Statement */}
      <section style={{ padding: '6rem 0', background: '#0F0D0C', borderBottom: '1px solid rgba(212, 163, 115, 0.08)' }}>
        <div className="container">
          <ScrollReveal variant="scale-up" delay={150}>
            <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#D4A373', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '1.5rem' }}>
                — KOPIMAGE PHILOSOPHY —
              </span>
              <blockquote
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3.6rem)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: '#F7F4EF',
                  margin: 0,
                }}
              >
                "Bukan sekadar tempat untuk minum kopi.{' '}
                <span style={{ color: '#D4A373', fontStyle: 'italic', fontWeight: 400 }}>
                  Ada alasan untuk tinggal lebih lama."
                </span>
              </blockquote>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. Storytelling & Origin (Scroll Reveal Asymmetric Grid) */}
      <section id="story" className="py-20 lg:py-36 bg-[#161311]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Photo Reveal */}
            <div className="lg:col-span-6">
              <ScrollReveal variant="slide-right" delay={100}>
                <div className="img-hover-zoom-container relative h-[320px] sm:h-[450px] lg:h-[560px] rounded-2xl overflow-hidden">
                  <Image
                    src={pouringImage}
                    alt="Barista brewing manual pour over coffee"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </ScrollReveal>
            </div>

            {/* Right Story Copy Reveal */}
            <div className="lg:col-span-6 lg:pl-6">
              <ScrollReveal variant="slide-left" delay={200}>
                <span style={{ fontSize: '0.85rem', color: '#C67D5A', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
                  Kisah &amp; Dedikasi Rasamu
                </span>
                <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 800, color: '#F7F4EF', lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                  Lahir di Gading Tutuka untuk Setiap Ceritamu.
                </h2>
                <p style={{ fontSize: '1rem', color: '#C4BBB4', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  KOPIMAGE dibangun atas kecintaan terhadap racikan kopi yang konsisten dan kenyamanan ruang singgah. Di setiap tetes espresso dan setiap porsi hidangan yang kami sajikan, ada ketelitian barista dan kehangatan khas Soreang.
                </p>
                <p style={{ fontSize: '1rem', color: '#8E847C', lineHeight: 1.7, marginBottom: '2rem' }}>
                  Mau ngerjain tugas, bertukar cerita bareng sahabat, atau sekadar me-time santai — meja kami selalu terbuka buatmu.
                </p>

                <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(212,163,115,0.15)', paddingTop: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373' }}>07.00</div>
                    <span style={{ fontSize: '0.82rem', color: '#8E847C' }}>Pagi Siap Menyeduh</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373' }}>23.00</div>
                    <span style={{ fontSize: '0.82rem', color: '#8E847C' }}>Malam Hangat Berakhir</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Big Typography Interlude Reveal */}
      <section style={{ padding: '6rem 0', background: '#0F0D0C', textAlign: 'center', borderTop: '1px solid rgba(212,163,115,0.08)', borderBottom: '1px solid rgba(212,163,115,0.08)' }}>
        <div className="container">
          <ScrollReveal variant="fade-up" delay={150}>
            <div style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3.2rem)', fontWeight: 800, color: '#F7F4EF', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              COME FOR THE COFFEE.{' '}
              <span style={{ color: '#D4A373', display: 'block', fontStyle: 'italic', fontWeight: 400, textTransform: 'none', marginTop: '0.4rem' }}>
                Stay for the moment.
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 6. Food & Beverage Teaser Reveal */}
      <section id="experience" className="py-20 lg:py-36 bg-[#161311]">
        <div className="container">
          
          <ScrollReveal variant="fade-up" delay={100}>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
              <span style={{ fontSize: '0.85rem', color: '#D4A373', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                Culinary &amp; Coffee Teaser
              </span>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 800, color: '#F7F4EF', marginBottom: '1.25rem' }}>
                Sajian Khas Meja KOPIMAGE
              </h2>
              <blockquote style={{ fontSize: '1.1rem', color: '#D4A373', fontStyle: 'italic', margin: 0 }}>
                "What happens at the table stays with the table."
              </blockquote>
            </div>
          </ScrollReveal>

          {/* Asymmetric Food Photography Showcase Reveal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <ScrollReveal variant="scale-up" delay={150}>
                <div className="img-hover-zoom-container relative h-[300px] sm:h-[400px] lg:h-[480px] rounded-2xl overflow-hidden">
                  <Image
                    src={foodImage}
                    alt="Appetizing coffee and culinary at KOPIMAGE table"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-5">
              <ScrollReveal variant="fade-up" delay={250}>
                <div style={{ background: '#1E1A17', padding: '2.5rem 2rem', borderRadius: '18px', border: '1px solid rgba(212,163,115,0.15)' }}>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F7F4EF', marginBottom: '1rem' }}>
                    Koleksi Racikan &amp; Santapan
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#C4BBB4', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    Dari Es Kopi Susu signature berbahan gula aren pilihan, varian kemasan Botolin 1 Liter, hingga kudapan gurih Mie Julid dan Buncis Pedas Ketus yang selalu dicari.
                  </p>
                  <p style={{ fontSize: '0.88rem', color: '#8E847C', lineHeight: 1.6 }}>
                    Seluruh menu kami bisa kamu jelajahi dan pesan secara langsung saat berada di meja kedai lewat scan kode QR.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

        </div>
      </section>

      {/* 7. The Space — Interior & Terrace Atmosphere Reveal */}
      <section id="space" className="py-20 lg:py-36 bg-[#0F0D0C]">
        <div className="container">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5">
              <ScrollReveal variant="slide-right" delay={100}>
                <span style={{ fontSize: '0.85rem', color: '#C67D5A', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
                  The Physical Ambience
                </span>
                <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 800, color: '#F7F4EF', lineHeight: 1.15, marginBottom: '1.5rem' }}>
                  Suasana Soreang yang Menenangkan.
                </h2>
                <p style={{ fontSize: '1rem', color: '#C4BBB4', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  Dirancang dengan perpaduan material kayu hangat, pencahayaan redup yang nyaman untuk mata, serta area outdoor terrace yang sejuk untuk menikmati senja Gading Tutuka.
                </p>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-7">
              <ScrollReveal variant="slide-left" delay={200}>
                <div className="img-hover-zoom-container relative h-[320px] sm:h-[420px] lg:h-[500px] rounded-2xl overflow-hidden">
                  <Image
                    src={spaceImage}
                    alt="KOPIMAGE Terrace Space at twilight"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </ScrollReveal>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Cara Memesan — Staggered Step Reveal (DUDUK -> SCAN -> PILIH -> NIKMATI) */}
      <section id="qr-guide" style={{ padding: '6rem 0', background: '#161311', borderTop: '1px solid rgba(212, 163, 115, 0.12)' }}>
        <div className="container">
          <ScrollReveal variant="fade-up" delay={100}>
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem auto' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(212,163,115,0.15)', border: '1px solid rgba(212,163,115,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <QrCode size={28} color="#D4A373" />
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', fontWeight: 800, color: '#F7F4EF', marginBottom: '1rem' }}>
                Pemesanan di Tempat Sangat Praktis
              </h2>
              <p style={{ fontSize: '1rem', color: '#C4BBB4', margin: 0, lineHeight: 1.6 }}>
                Menu lengkap dan transaksi langsung tersedia di setiap meja kedai kami. Tanpa perlu antre panjang di kasir.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 Simple Steps Staggered Reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1000px] mx-auto">
            
            <ScrollReveal variant="fade-up" delay={100}>
              <div style={{ background: '#1E1A17', padding: '2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(212,163,115,0.12)', textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373', marginBottom: '0.5rem' }}>01</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.4rem' }}>DUDUK</h4>
                <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0 }}>Pilih spot duduk favoritmu di area indoor atau terrace sejuk.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={200}>
              <div style={{ background: '#1E1A17', padding: '2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(212,163,115,0.12)', textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373', marginBottom: '0.5rem' }}>02</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.4rem' }}>SCAN</h4>
                <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0 }}>Scan stiker QR yang terpasang di mejamu pakai kamera HP.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={300}>
              <div style={{ background: '#1E1A17', padding: '2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(212,163,115,0.12)', textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373', marginBottom: '0.5rem' }}>03</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.4rem' }}>PILIH</h4>
                <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0 }}>Pilih kopi, makanan, varian suhu/porsi, dan tentukan metode bayar.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={400}>
              <div style={{ background: '#1E1A17', padding: '2rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(212,163,115,0.12)', textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4A373', marginBottom: '0.5rem' }}>04</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.4rem' }}>NIKMATI</h4>
                <p style={{ fontSize: '0.85rem', color: '#8E847C', margin: 0 }}>Pesananmu bakal diantar langsung hangat ke meja.</p>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* 9. Location & Hours Reveal */}
      <section id="location" className="py-20 lg:py-36 bg-[#0F0D0C]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-6">
              <ScrollReveal variant="slide-right" delay={100}>
                <span style={{ fontSize: '0.85rem', color: '#D4A373', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>
                  Lokasi &amp; Kontak
                </span>
                <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 800, color: '#F7F4EF', marginBottom: '1.5rem' }}>
                  Kunjungi Kami di Soreang.
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <MapPin size={22} color="#D4A373" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F7F4EF', margin: 0 }}>Alamat Kedai</h4>
                      <p style={{ fontSize: '0.95rem', color: '#C4BBB4', margin: 0 }}>KOPIMAGE, Kawasan Gading Tutuka, Soreang, Kabupaten Bandung, Jawa Barat</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <Clock size={22} color="#D4A373" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F7F4EF', margin: 0 }}>Jam Operasional</h4>
                      <p style={{ fontSize: '0.95rem', color: '#C4BBB4', margin: 0 }}>Buka Setiap Hari: 07.00 - 23.00 WIB</p>
                    </div>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=KOPIMAGE+Soreang"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(212,163,115,0.15)',
                    border: '1px solid rgba(212,163,115,0.4)',
                    color: '#D4A373',
                    padding: '0.85rem 1.8rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>Buka Petunjuk Jalan (Google Maps)</span>
                  <ArrowRight size={16} />
                </a>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6">
              <ScrollReveal variant="slide-left" delay={200}>
                <div className="img-hover-zoom-container relative h-[300px] sm:h-[420px] rounded-2xl overflow-hidden border border-[rgba(212,163,115,0.15)]">
                  <Image
                    src={heroImage}
                    alt="Map and location atmosphere KOPIMAGE Soreang"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* 10. Minimalist Footer */}
      <footer style={{ padding: '3rem 0', background: '#090807', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F7F4EF', display: 'block', lineHeight: 1 }}>
              KOPIMAGE
            </span>
            <span style={{ fontSize: '0.78rem', color: '#8E847C' }}>
              © 2026 KOPIMAGE Soreang. All rights reserved.
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#8E847C' }}>
            Coffee, Eats &amp; Good Times di Gading Tutuka, Soreang
          </div>
        </div>
      </footer>

    </div>
  );
};
