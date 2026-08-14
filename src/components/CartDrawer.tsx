'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, estimatedSubtotal, totalItemsCount } = useCart();
  const { theme } = useTheme();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const isDark = theme === 'dark';

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 900,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          zIndex: 950,
          background: isDark ? '#161210' : '#FFFFFF',
          borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          padding: '1.75rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark ? '-8px 0 32px rgba(0, 0, 0, 0.7)' : '-8px 0 32px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {/* Drawer Header (No AI icon box) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.25rem',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                fontWeight: 800,
                fontFamily: 'serif',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Keranjang Pesanan
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                color: isDark ? '#A89F91' : '#666666',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                display: 'block',
                marginTop: '0.25rem',
              }}
            >
              {totalItemsCount} ITEM TERPILIH
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#FFFFFF' : '#1A1A1A',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Tutup Keranjang"
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: isDark ? '#A89F91' : '#666666' }}>
              <p style={{ fontSize: '1rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 700, marginBottom: '0.5rem' }}>
                Keranjang Anda masih kosong.
              </p>
              <span style={{ fontSize: '0.82rem', lineHeight: 1.5, display: 'block' }}>
                Silakan pilih racikan kopi atau hidangan favorit Anda dari katalog meja.
              </span>
            </div>
          ) : (
            cartItems.map((ci) => (
              <div
                key={ci.cartItemId}
                style={{
                  background: isDark ? 'rgba(30, 26, 23, 0.7)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #9E1F1F',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {ci.menuItem.name}
                    </h4>
                    {ci.selectedModifiers.length > 0 && (
                      <div style={{ fontSize: '0.72rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {ci.selectedModifiers.map((m, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: isDark ? 'rgba(212, 163, 115, 0.12)' : '#F7EBEB',
                              color: isDark ? '#D4A373' : '#9E1F1F',
                              border: isDark ? '1px solid rgba(212, 163, 115, 0.25)' : '1px solid #9E1F1F',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {m.optionLabel}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(ci.cartItemId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDark ? '#A89F91' : '#9E1F1F',
                      cursor: 'pointer',
                      padding: '0.2rem',
                    }}
                    title="Hapus item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.5rem',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(158, 31, 31, 0.15)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: isDark ? '#D4A373' : '#9E1F1F',
                    }}
                  >
                    Rp {(ci.unitPrice * ci.quantity).toLocaleString('id-ID')}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: isDark ? 'rgba(0,0,0,0.5)' : '#F0EBE8',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.12)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(ci.cartItemId, ci.quantity - 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        minWidth: '18px',
                        textAlign: 'center',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                    >
                      {ci.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(ci.cartItemId, ci.quantity + 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Total Summary */}
        {cartItems.length > 0 && (
          <div
            style={{
              paddingTop: '1.25rem',
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: isDark ? '#C4BBB4' : '#555555', fontSize: '0.88rem' }}>Estimasi Total Belanja:</span>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: isDark ? '#FFFFFF' : '#9E1F1F',
                }}
              >
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              style={{
                width: '100%',
                padding: '0.9rem',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '10px',
                backgroundColor: isDark ? '#B82E2E' : '#9E1F1F',
                color: '#FFFFFF',
                border: isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}
    </>
  );
};
