'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, estimatedSubtotal, totalItemsCount } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
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

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          zIndex: 950,
          background: '#161311',
          borderLeft: '1px solid var(--border-active)',
          padding: '1.75rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(212, 163, 115, 0.15)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212, 163, 115, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} color="#D4A373" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#F7F4EF', fontWeight: 800, margin: 0, lineHeight: 1 }}>Keranjang Pesanan</h3>
              <span style={{ fontSize: '0.78rem', color: '#8E847C' }}>{totalItemsCount} item terpilih</span>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{ background: 'none', border: 'none', color: '#C4BBB4', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#8E847C' }}>
              <ShoppingBag size={48} color="rgba(212, 163, 115, 0.3)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.95rem', color: '#C4BBB4' }}>Keranjang belanja Anda masih kosong.</p>
              <span style={{ fontSize: '0.8rem' }}>Pilih racikan kopi atau makanan favorit Anda dari menu.</span>
            </div>
          ) : (
            cartItems.map((ci) => (
              <div
                key={ci.cartItemId}
                style={{
                  background: 'rgba(30, 26, 23, 0.7)',
                  border: '1px solid rgba(212, 163, 115, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.2rem' }}>
                      {ci.menuItem.name}
                    </h4>
                    {ci.selectedModifiers.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: '#D4A373', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {ci.selectedModifiers.map((m, idx) => (
                          <span key={idx} style={{ background: 'rgba(212, 163, 115, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {m.optionLabel}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(ci.cartItemId)}
                    style={{ background: 'none', border: 'none', color: '#8E847C', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#D4A373' }}>
                    Rp {(ci.unitPrice * ci.quantity).toLocaleString('id-ID')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    <button
                      onClick={() => updateQuantity(ci.cartItemId, ci.quantity - 1)}
                      style={{ background: 'none', border: 'none', color: '#F7F4EF', cursor: 'pointer', display: 'flex' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '18px', textAlign: 'center', color: '#F7F4EF' }}>
                      {ci.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(ci.cartItemId, ci.quantity + 1)}
                      style={{ background: 'none', border: 'none', color: '#F7F4EF', cursor: 'pointer', display: 'flex' }}
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
          <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(212, 163, 115, 0.15)', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#C4BBB4', fontSize: '0.92rem' }}>Estimasi Total Belanja:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D4A373' }}>
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', justifyContent: 'center', fontSize: '1rem' }}
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
