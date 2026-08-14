'use client';

import React, { useState } from 'react';
import { MenuItem, SelectedModifierOption } from '@/types/menu';
import { useCart, parseDisplayPrice } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { X, Plus, Minus } from 'lucide-react';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCart();
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [selectedTemp, setSelectedTemp] = useState<string>('Cold');
  const [selectedSize, setSelectedSize] = useState<string>('Normal');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const isDark = theme === 'dark';

  // Determine available modifiers based on category and item properties
  const isCoffeeOrDrink = item.category === 'coffee' || item.category === 'non-coffee';
  const hasLiterOption = !!item.priceLiter;

  const handleAddToCart = () => {
    const modifiers: SelectedModifierOption[] = [];

    if (isCoffeeOrDrink) {
      modifiers.push({
        modifierId: 'temp',
        modifierName: 'Suhu Minuman',
        optionId: selectedTemp.toLowerCase(),
        optionLabel: selectedTemp === 'Cold' ? 'Dingin (Es)' : 'Panas (Hot)',
        priceDelta: 0,
      });
    }

    if (hasLiterOption && selectedSize === 'Literan') {
      const literPriceNum = parseDisplayPrice(item.priceLiter || '');
      const basePriceNum = parseDisplayPrice(item.price);
      modifiers.push({
        modifierId: 'size',
        modifierName: 'Porsi Ukuran',
        optionId: 'literan',
        optionLabel: `Kemasan Botol 1 Liter (${item.priceLiter})`,
        priceDelta: Math.max(0, literPriceNum - basePriceNum),
      });
    }

    addToCart(item, modifiers, quantity, notes);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '16px',
          padding: '1.75rem',
          position: 'relative',
          background: isDark ? '#161210' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #9E1F1F',
          color: isDark ? '#FFFFFF' : '#1A1A1A',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.7)' : '0 16px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5EBEB',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #9E1F1F',
            color: isDark ? '#FFFFFF' : '#1A1A1A',
            borderRadius: '9999px',
            padding: '0.4rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ marginBottom: '1.25rem', paddingRight: '2rem' }}>
          <h3 style={{ fontSize: '1.35rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 800, fontFamily: 'serif', marginBottom: '0.3rem' }}>
            {item.name}
          </h3>
          <div style={{ fontSize: '1.2rem', color: isDark ? '#D4A373' : '#9E1F1F', fontWeight: 800, fontFamily: 'monospace' }}>
            {item.price}
          </div>
        </div>

        {/* Temperature Modifier Selector */}
        {isCoffeeOrDrink && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(158, 31, 31, 0.15)' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              PILIHAN PENYAJIAN:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedTemp('Cold')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: selectedTemp === 'Cold'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.15)'),
                  background: selectedTemp === 'Cold'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: selectedTemp === 'Cold' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>COLD (DINGIN / ES)</span>
              </button>
              <button
                onClick={() => setSelectedTemp('Hot')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: selectedTemp === 'Hot'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.15)'),
                  background: selectedTemp === 'Hot'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: selectedTemp === 'Hot' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>HOT (HANGAT / PANAS)</span>
              </button>
            </div>
          </div>
        )}

        {/* Size Variant Selector */}
        {hasLiterOption && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(158, 31, 31, 0.15)' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: isDark ? '#A89F91' : '#555555', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              VARIAN UKURAN / PORSI:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={() => setSelectedSize('Normal')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: selectedSize === 'Normal'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.15)'),
                  background: selectedSize === 'Normal'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: selectedSize === 'Normal' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Gelas Normal (Cup)</span>
                <span>{item.price}</span>
              </button>
              <button
                onClick={() => setSelectedSize('Literan')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: selectedSize === 'Literan'
                    ? (isDark ? '1px solid #B82E2E' : '1px solid #9E1F1F')
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.15)'),
                  background: selectedSize === 'Literan'
                    ? (isDark ? '#B82E2E' : '#9E1F1F')
                    : (isDark ? '#0E0B0A' : '#FFFFFF'),
                  color: selectedSize === 'Literan' ? '#FFFFFF' : (isDark ? '#A89F91' : '#1A1A1A'),
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Botol 1 Liter</span>
                <span>{item.priceLiter}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quantity Controller */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.88rem', color: isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase' }}>
            JUMLAH PESANAN:
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: isDark ? '#0E0B0A' : '#F0EBE8',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.15)',
              padding: '0.3rem 0.6rem',
              borderRadius: '8px',
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ background: 'none', border: 'none', color: isDark ? '#FFFFFF' : '#1A1A1A', cursor: 'pointer', padding: '0.3rem', display: 'flex' }}
            >
              <Minus size={16} />
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', minWidth: '24px', textAlign: 'center', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{ background: 'none', border: 'none', color: isDark ? '#FFFFFF' : '#1A1A1A', cursor: 'pointer', padding: '0.3rem', display: 'flex' }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Add to Cart CTA */}
        <button
          onClick={handleAddToCart}
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
          <span>Tambah ke Keranjang</span>
        </button>

      </div>
    </div>
  );
};
