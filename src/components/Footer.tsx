import React from 'react';
import { Coffee, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ padding: '3.5rem 0 2rem 0', borderTop: '1px solid rgba(212, 163, 115, 0.12)', background: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Coffee size={18} color="#0F0D0C" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F7F4EF', letterSpacing: '-0.02em' }}>
              KOPIMAGE
            </span>
          </div>

          <p style={{ color: '#8E847C', fontSize: '0.9rem', maxWidth: '450px' }}>
            Gading Tutuka, Soreang • Buka Setiap Hari (07.00 - 23.00 WIB)
          </p>

          <div style={{ fontSize: '0.82rem', color: '#8E847C', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', width: '100%' }}>
            © {new Date().getFullYear()} KOPIMAGE Soreang. Designed &amp; Crafted with{' '}
            <Heart size={12} color="#C67D5A" style={{ display: 'inline', margin: '0 2px' }} /> by Acelino Developer OS.
          </div>

        </div>
      </div>
    </footer>
  );
};
