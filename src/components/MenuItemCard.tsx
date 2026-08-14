'use client';

import React, { useState } from 'react';
import { MenuItem } from '../types/menu';
import { Plus } from 'lucide-react';
import { ItemCustomizerModal } from './ItemCustomizerModal';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  return (
    <>
      <div
        className="glass-panel group"
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
              src={item.image || '/images/kopimage_hero_atmosphere_1786480906850.webp'}
              alt={item.name}
              className="group-hover:scale-105 transition-transform duration-500"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/kopimage_hero_atmosphere_1786480906850.webp';
              }}
            />
          </div>

          {/* Badges Bar (Clean Under + Top Line Editorial) */}
          {(item.isSeasonal || item.isBestSeller || item.temperature) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              {item.isSeasonal && (
                <span className="badge badge-seasonal">
                  Seasonal
                </span>
              )}
              {item.isBestSeller && (
                <span className="badge badge-bestseller">
                  Best Seller
                </span>
              )}
              {item.temperature && (
                <span className="badge badge-tag">
                  {item.temperature}
                </span>
              )}
            </div>
          )}

          {/* Item Title */}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'inherit', marginBottom: '0.4rem', lineHeight: 1.3 }}>
            {item.name}
          </h3>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: '0.86rem', color: '#888888', lineHeight: 1.5, marginBottom: '1.1rem' }}>
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
              {item.tags.map((tag, idx) => (
                <span key={idx} style={{ fontSize: '0.7rem', color: '#888888', background: 'transparent', padding: '0.1rem 0.35rem', borderTop: '1px solid rgba(150,150,150,0.25)', borderBottom: '1px solid rgba(150,150,150,0.25)', fontFamily: 'monospace' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Pricing & Order Action */}
        <div style={{ paddingTop: '0.9rem', borderTop: '1px solid rgba(158, 31, 31, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#9E1F1F', lineHeight: 1 }}>
              {item.price}
            </div>
            {item.priceLiter && (
              <div style={{ fontSize: '0.72rem', color: '#666666', fontWeight: 600, marginTop: '0.35rem', letterSpacing: '0.02em' }}>
                Literan: {item.priceLiter}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            style={{
              display: 'inline-flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              padding: '0.5rem 0.95rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#9E1F1F',
              color: '#FFFFFF',
              border: '1px solid #9E1F1F',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
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
