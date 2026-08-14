'use client';

import React, { useState, useMemo } from 'react';
import { CATEGORIES, MENU_ITEMS as defaultMenuItems } from '@/data/menuData';
import { MenuCategoryId, MenuItem } from '@/types/menu';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Search, Filter, X, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

import { FloatingOrderStatusWidget } from '@/components/FloatingOrderStatusWidget';

interface QROrderingViewProps {
  tableId: string;
}

export const QROrderingView: React.FC<QROrderingViewProps> = ({ tableId }) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>([]);
  const { totalItemsCount, estimatedSubtotal, setIsCartOpen } = useCart();

  // Clean human-friendly table code display (Never display raw UUIDs)
  const cleanTableDisplay = useMemo(() => {
    if (!tableId) return '1';
    const str = String(tableId).trim();
    if (str.includes('-') || str.length > 8) {
      return '1';
    }
    return str;
  }, [tableId]);

  // Fetch Live Menu Items from /api/menu & default fallback
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        ['kopimage_custom_menu', 'kopimage_custom_menu_v2', 'kopimage_custom_menu_v3'].forEach((k) => {
          localStorage.removeItem(k);
        });
      } catch (e) {}
    }

    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.menu) && data.menu.length > 0) {
          setLiveMenuItems(data.menu);
        } else {
          setLiveMenuItems(defaultMenuItems);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch live menu:', err);
        setLiveMenuItems(defaultMenuItems);
      });
  }, []);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return liveMenuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, liveMenuItems]);

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.25s ease, color 0.25s ease' }}>
      <Header />

      {/* Hero Table Section */}
      <section style={{ paddingTop: '7.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'left', padding: '0 1rem' }}>
            
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#C29B7F',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.75rem'
              }}
            >
              <MapPin size={14} color="#B82E2E" />
              <span>MEJA {cleanTableDisplay} • SOREANG</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, fontFamily: 'serif', color: '#F7F4EF', lineHeight: 1.25, marginBottom: '0.75rem' }}>
              Katalog Racikan Meja {cleanTableDisplay}
            </h1>

            <p style={{ fontSize: '0.92rem', color: '#A89F91', lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>
              Silakan pilih racikan kopi murni, minuman segar, cemilan, dan makanan utama. Pesanan diantar langsung ke Meja {cleanTableDisplay}.
            </p>

          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section id="menu" style={{ padding: '2.5rem 0 6rem 0', flex: 1 }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* Search & Category Navigation Bar */}
          <div style={{ marginBottom: '2rem' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Cari menu kopi, buncis pedas, mie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 2.8rem 0.85rem 2.8rem',
                  fontSize: '0.9rem',
                  background: '#120E0C',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#F7F4EF',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <Search
                size={18}
                color="#A89F91"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#A89F91',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Clean Category Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'none'
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: isActive ? '1px solid #B82E2E' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? '#B82E2E' : '#120E0C',
                      color: isActive ? '#FFFFFF' : '#A89F91',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Menu Count Label */}
          <div style={{ marginBottom: '1.5rem', color: '#A89F91', fontSize: '0.82rem', fontFamily: 'monospace' }}>
            Menampilkan {filteredItems.length} menu untuk kategori "{CATEGORIES.find((c) => c.id === activeCategory)?.name}"
          </div>

          {/* Menu Items Grid */}
          {filteredItems.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                borderRadius: '16px',
                maxWidth: '440px',
                margin: '0 auto',
                background: '#120E0C',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <Filter size={32} color="#C29B7F" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#F7F4EF', marginBottom: '0.4rem', fontFamily: 'serif' }}>Menu Tidak Ditemukan</h3>
              <p style={{ color: '#A89F91', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Tidak ada menu yang cocok dengan kata kunci "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: '#B82E2E',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reset Filter
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Floating Sticky Cart Bar - PERFECTLY CENTERED WITH FLEX CONTAINER */}
      {totalItemsCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            padding: '0 1rem'
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '460px'
            }}
          >
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                background: '#B82E2E',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#090807', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#F7F4EF', fontFamily: 'monospace' }}>
                  {totalItemsCount}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', display: 'block' }}>
                    KERANJANG MEJA {cleanTableDisplay}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'serif' }}>
                    Rp {estimatedSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                <span>LANJUT PEMESANAN</span>
                <ArrowRight size={16} />
              </div>
            </button>
          </motion.div>
        </div>
      )}

      {/* Persistent Customer Order Status Floating Widget */}
      <FloatingOrderStatusWidget />

      <Footer />
    </div>
  );
};

export default QROrderingView;
