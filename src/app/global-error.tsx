'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id" style={{ background: '#0F0D0C', color: '#F7F4EF' }}>
      <body style={{ background: '#0F0D0C', color: '#F7F4EF', margin: 0, padding: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '480px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(231, 76, 60, 0.15)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <AlertTriangle size={32} color="#E74C3C" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F7F4EF' }}>
            Fatal Application Error
          </h2>

          <p style={{ color: '#C4BBB4', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            {error.message || 'Terjadi kesalahan sistem fatal pada aplikasi KOPIMAGE.'}
          </p>

          <button
            onClick={() => reset()}
            style={{
              background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
              color: '#0F0D0C',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.8rem 1.8rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={18} />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
