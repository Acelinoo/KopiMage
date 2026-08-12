'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: '#0F0D0C',
        color: '#F7F4EF',
      }}
    >
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
          marginBottom: '1.25rem',
        }}
      >
        <AlertTriangle size={32} color="#E74C3C" />
      </div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F7F4EF' }}>
        Terjadi Kesalahan Sistem
      </h2>

      <p style={{ color: '#C4BBB4', maxWidth: '480px', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
        {error.message || 'Terjadi masalah saat memuat data. Silakan coba muat ulang halaman.'}
      </p>

      <button
        onClick={() => reset()}
        className="btn btn-primary"
        style={{ padding: '0.8rem 1.8rem' }}
      >
        <RefreshCw size={18} />
        <span>Coba Muat Ulang (Retry)</span>
      </button>
    </div>
  );
}
