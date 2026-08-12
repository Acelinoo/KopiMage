'use client';

import React, { useState, useMemo } from 'react';
import { CATEGORIES, MENU_ITEMS } from '../data/menuData';
import { MenuCategoryId, MenuItem } from '../types/menu';
import { MenuItemCard } from './MenuItemCard';
import { Search, Sparkles, Filter, X } from 'lucide-react';

export const MenuSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered menu items calculation
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      // Category match
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="menu" style={{ padding: '5rem 0', position: 'relative' }}>
      <div className="container">
        
        {/* Section Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#D4A373',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}
          >
            <Sparkles size={15} />
            <span>Katalog Kuliner &amp; Kopi</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#F7F4EF', marginBottom: '0.75rem' }}>
            Menu Spesial KOPIMAGE
          </h2>
          <p style={{ color: '#C4BBB4', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Temukan racikan kopi autentik, minuman segar, camilan lezat, hingga santapan utama favorit di Soreang.
          </p>
        </div>

        {/* Search Bar & Category Navigation */}
        <div style={{ maxWidth: '850px', margin: '0 auto 3rem auto' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Cari kopi, buncis pedas, mie julid, es kopi susu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 3rem',
                fontSize: '1rem',
                background: 'rgba(30, 26, 23, 0.8)',
                border: '1px solid rgba(212, 163, 115, 0.25)',
                borderRadius: 'var(--radius-full)',
                color: '#F7F4EF',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit'
              }}
            />
            <Search
              size={20}
              color="#8E847C"
              style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1.2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#8E847C',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Horizontal Scrollable Category Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: isActive ? '1px solid #D4A373' : '1px solid rgba(212, 163, 115, 0.12)',
                    background: isActive ? 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)' : 'rgba(30, 26, 23, 0.6)',
                    color: isActive ? '#0F0D0C' : '#C4BBB4',
                    boxShadow: isActive ? '0 4px 16px rgba(212, 163, 115, 0.3)' : 'none'
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

        </div>

        {/* Selected Category Description Bar */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', color: '#8E847C', fontSize: '0.9rem' }}>
          Menampilkan <strong style={{ color: '#D4A373' }}>{filteredItems.length}</strong> menu untuk category{' '}
          <span style={{ color: '#F7F4EF', fontWeight: 600 }}>
            "{CATEGORIES.find((c) => c.id === activeCategory)?.name}"
          </span>
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '500px',
              margin: '0 auto'
            }}
          >
            <Filter size={40} color="#D4A373" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.5rem' }}>Menu Tidak Ditemukan</h3>
            <p style={{ color: '#C4BBB4', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Tidak ada menu yang cocok dengan kata kunci "{searchQuery}". Coba kata kunci lain atau pilih kategori berbeda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filter
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
