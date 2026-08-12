'use client';

import React, { useState, useEffect } from 'react';
import { Coffee, ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItemsCount, setIsCartOpen, activeTableId } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: isScrolled ? 'rgba(15, 13, 12, 0.94)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(212, 163, 115, 0.15)' : '1px solid transparent',
        padding: isScrolled ? '0.85rem 0' : '1.25rem 0',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: '#F7F4EF' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(212, 163, 115, 0.25)'
            }}
          >
            <Coffee size={22} color="#0F0D0C" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
              KOPIMAGE
            </span>
            <span style={{ fontSize: '0.68rem', color: '#D4A373', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
              {activeTableId ? `Meja ${activeTableId} • Soreang` : 'Gading Tutuka • Soreang'}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          <a href="#menu" style={{ color: '#C4BBB4', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>
            Daftar Menu
          </a>
          <a href="#about" style={{ color: '#C4BBB4', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>
            Tentang Kami
          </a>
          <a href="#location" style={{ color: '#C4BBB4', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>
            Lokasi & Jam Buka
          </a>
        </nav>

        {/* Header Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <ShoppingBag size={18} />
            <span>Keranjang</span>
            {totalItemsCount > 0 && (
              <span
                style={{
                  background: '#E74C3C',
                  color: '#FFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  padding: '0.15rem 0.45rem',
                  lineHeight: 1,
                  boxShadow: '0 2px 8px rgba(231, 76, 60, 0.4)',
                }}
              >
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#F7F4EF',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle menu"
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(22, 19, 17, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(212, 163, 115, 0.2)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <a
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#F7F4EF', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}
          >
            Daftar Menu
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#F7F4EF', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}
          >
            Tentang Kami
          </a>
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#F7F4EF', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}
          >
            Lokasi & Jam Buka
          </a>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
