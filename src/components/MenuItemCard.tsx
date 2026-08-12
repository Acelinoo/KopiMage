'use client';

import React, { useState } from 'react';
import { MenuItem } from '../types/menu';
import { Sparkles, Thermometer, Plus } from 'lucide-react';
import { ItemCustomizerModal } from './ItemCustomizerModal';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  return (
    <>
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          transition: 'all var(--transition-normal)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div>
          {/* Menu Image Preview */}
          <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem', background: '#161311', border: '1px solid rgba(255,255,255,0.08)' }}>
            <img
              src={item.image || '/images/kopimage_hero_atmosphere_1786480906850.png'}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/kopimage_hero_atmosphere_1786480906850.png';
              }}
            />
          </div>

          {/* Badges Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
            {item.isSeasonal && (
              <span className="badge badge-seasonal">
                <Sparkles size={12} /> Seasonal
              </span>
            )}
            {item.isBestSeller && (
              <span className="badge badge-bestseller">
                ⭐ Best Seller
              </span>
            )}
            {item.temperature && (
              <span className="badge badge-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Thermometer size={12} /> {item.temperature}
              </span>
            )}
          </div>

          {/* Item Title */}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F7F4EF', marginBottom: '0.4rem', lineHeight: 1.3 }}>
            {item.name}
          </h3>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: '0.86rem', color: '#C4BBB4', lineHeight: 1.5, marginBottom: '1.1rem' }}>
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
              {item.tags.map((tag, idx) => (
                <span key={idx} style={{ fontSize: '0.72rem', color: '#8E847C', background: 'rgba(255, 255, 255, 0.03)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Pricing & Order Action */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(212, 163, 115, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D4A373', lineHeight: 1 }}>
              {item.price}
            </div>
            {item.priceLiter && (
              <div style={{ fontSize: '0.75rem', color: '#C67D5A', fontWeight: 600, marginTop: '0.25rem' }}>
                Literan: {item.priceLiter}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="btn btn-primary btn-sm"
            title={`Pilih varian ${item.name}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={14} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {isCustomizerOpen && (
        <ItemCustomizerModal
          item={item}
          onClose={() => setIsCustomizerOpen(false)}
        />
      )}
    </>
  );
};
