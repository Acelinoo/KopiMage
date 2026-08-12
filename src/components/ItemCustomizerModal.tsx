'use client';

import React, { useState } from 'react';
import { MenuItem, SelectedModifierOption } from '@/types/menu';
import { useCart, parseDisplayPrice } from '@/context/CartContext';
import { X, Thermometer, Coffee, Plus, Minus, ShoppingBag } from 'lucide-react';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({ item, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedTemp, setSelectedTemp] = useState<string>('Cold');
  const [selectedSize, setSelectedSize] = useState<string>('Normal');
  const [notes, setNotes] = useState('');

  if (!item) return null;

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
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          position: 'relative',
          background: '#161311',
          border: '1px solid var(--border-active)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#C4BBB4',
            borderRadius: '9999px',
            padding: '0.4rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ marginBottom: '1.25rem', paddingRight: '2rem' }}>
          <h3 style={{ fontSize: '1.35rem', color: '#F7F4EF', fontWeight: 800, marginBottom: '0.3rem' }}>
            {item.name}
          </h3>
          <div style={{ fontSize: '1.25rem', color: '#D4A373', fontWeight: 800 }}>
            {item.price}
          </div>
        </div>

        {/* Temperature Modifier Selector */}
        {isCoffeeOrDrink && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(212, 163, 115, 0.12)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#C4BBB4', fontWeight: 600, marginBottom: '0.75rem' }}>
              <Thermometer size={16} color="#D4A373" />
              <span>Pilihan Suhu Minuman:</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedTemp('Cold')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedTemp === 'Cold' ? '1px solid #D4A373' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedTemp === 'Cold' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: selectedTemp === 'Cold' ? '#D4A373' : '#C4BBB4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>🧊 Cold (Es)</span>
              </button>
              <button
                onClick={() => setSelectedTemp('Hot')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedTemp === 'Hot' ? '1px solid #D4A373' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedTemp === 'Hot' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: selectedTemp === 'Hot' ? '#D4A373' : '#C4BBB4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>☕ Hot (Panas)</span>
              </button>
            </div>
          </div>
        )}

        {/* Size Variant Selector */}
        {hasLiterOption && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(212, 163, 115, 0.12)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', color: '#C4BBB4', fontWeight: 600, marginBottom: '0.75rem' }}>
              <Coffee size={16} color="#D4A373" />
              <span>Varian Ukuran / Porsi:</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={() => setSelectedSize('Normal')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedSize === 'Normal' ? '1px solid #D4A373' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedSize === 'Normal' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: selectedSize === 'Normal' ? '#D4A373' : '#C4BBB4',
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
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedSize === 'Literan' ? '1px solid #D4A373' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: selectedSize === 'Literan' ? 'rgba(212, 163, 115, 0.2)' : 'rgba(30, 26, 23, 0.6)',
                  color: selectedSize === 'Literan' ? '#D4A373' : '#C4BBB4',
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
          <span style={{ fontSize: '0.92rem', color: '#F7F4EF', fontWeight: 600 }}>Jumlah Porsi:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(30, 26, 23, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ background: 'none', border: 'none', color: '#F7F4EF', cursor: 'pointer', padding: '0.3rem', display: 'flex' }}
            >
              <Minus size={16} />
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: '24px', textAlign: 'center', color: '#D4A373' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{ background: 'none', border: 'none', color: '#F7F4EF', cursor: 'pointer', padding: '0.3rem', display: 'flex' }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Add to Cart CTA */}
        <button
          onClick={handleAddToCart}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.9rem', justifyContent: 'center', fontSize: '1rem' }}
        >
          <ShoppingBag size={18} />
          <span>Tambah ke Keranjang</span>
        </button>

      </div>
    </div>
  );
};
