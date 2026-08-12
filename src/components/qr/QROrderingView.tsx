'use client';

import React, { useState, useMemo } from 'react';
import { CATEGORIES, MENU_ITEMS } from '@/data/menuData';
import { MenuCategoryId, MenuItem } from '@/types/menu';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Search, Sparkles, Filter, X, ShoppingBag, ArrowRight, MapPin, Coffee, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QROrderingViewProps {
  tableId: string;
}

export const QROrderingView: React.FC<QROrderingViewProps> = ({ tableId }) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>([]);
  const { totalItemsCount, estimatedSubtotal, setIsCartOpen } = useCart();

  // Fetch Live Menu Items from /api/menu & LocalStorage fallback
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        ['kopimage_custom_menu', 'kopimage_custom_menu_v2', 'kopimage_custom_menu_v3'].forEach((k) => {
          const raw = localStorage.getItem(k);
          if (raw && (raw.includes('data:image') || raw.length > 10000)) {
            localStorage.removeItem(k);
          }
        });
      } catch (e) {}
    }

    const isCleared = typeof window !== 'undefined' && localStorage.getItem('kopimage_menu_cleared') === 'true';
    const localMenu = typeof window !== 'undefined' ? localStorage.getItem('kopimage_custom_menu_v3') : null;
    const parsedLocal = localMenu ? JSON.parse(localMenu) : [];

    if (isCleared && parsedLocal.length === 0) {
      setLiveMenuItems([]);
    } else {
      fetch('/api/menu')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.menu)) {
            const apiIds = new Set(data.menu.map((m: any) => m.id));
            const merged = [...data.menu, ...parsedLocal.filter((m: any) => !apiIds.has(m.id))];
            setLiveMenuItems(merged);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch live menu:', err);
          setLiveMenuItems(parsedLocal);
        });
    }
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
    <div style={{ background: '#070605', color: '#F7F4EF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero Table Banner */}
      <section style={{ paddingTop: '8rem', paddingBottom: '3rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(184, 46, 46, 0.22) 0%, rgba(7, 6, 5, 0) 75%)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            
            {/* Table Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 1.4rem',
                borderRadius: '9999px',
                background: 'rgba(184, 46, 46, 0.18)',
                border: '1px solid rgba(184, 46, 46, 0.5)',
                color: '#F7F4EF',
                fontSize: '0.88rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 20px rgba(184, 46, 46, 0.2)'
              }}
            >
              <MapPin size={16} color="#B82E2E" />
              <span>SISTEM PEMESANAN MEJA {tableId} • DINE IN KOPIMAGE</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, fontFamily: 'serif', color: '#F7F4EF', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Selamat Datang di <span style={{ color: '#C29B7F' }}>Meja {tableId}</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#A89F91', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
              Pilih racikan kopi murni, minuman segar, cemilan, dan makanan berat favorit Anda. Pesanan akan diantar langsung ke Meja {tableId}.
            </p>

          </div>
        </div>
      </section>

      {/* Main Menu Catalog Section */}
      <section id="menu" style={{ padding: '3.5rem 0 7rem 0', flex: 1 }}>
        <div className="container">
          
          {/* Search & Category Filter Controls */}
          <div style={{ maxWidth: '880px', margin: '0 auto 2.5rem auto' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Cari kopi khas, buncis pedas, mie julid, es kopi susu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 3.2rem',
                  fontSize: '0.95rem',
                  background: '#120E0C',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  color: '#F7F4EF',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <Search
                size={20}
                color="#A89F91"
                style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#A89F91',
                    cursor: 'pointer',
                    padding: '0.2rem'
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
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
                      padding: '0.65rem 1.3rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      border: isActive ? '1px solid #B82E2E' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? '#B82E2E' : '#120E0C',
                      color: isActive ? '#FFFFFF' : '#A89F91',
                      boxShadow: isActive ? '0 4px 15px rgba(184, 46, 46, 0.3)' : 'none'
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Filter Status Text */}
          <div style={{ marginBottom: '2rem', textAlign: 'center', color: '#A89F91', fontSize: '0.88rem', fontFamily: 'monospace' }}>
            Menampilkan <strong style={{ color: '#C29B7F' }}>{filteredItems.length}</strong> menu untuk{' '}
            <span style={{ color: '#F7F4EF', fontWeight: 600 }}>
              "{CATEGORIES.find((c) => c.id === activeCategory)?.name}"
            </span>
          </div>

          {/* Menu Items Grid */}
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
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                borderRadius: '24px',
                maxWidth: '500px',
                margin: '0 auto',
                background: '#120E0C',
                border: '1px border-dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              <Filter size={40} color="#C29B7F" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.5rem', fontFamily: 'serif' }}>Menu Tidak Ditemukan</h3>
              <p style={{ color: '#A89F91', fontSize: '0.88rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                Tidak ada menu yang cocok dengan kata kunci "{searchQuery}". Coba pencarian lain.
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

      {/* Floating Sticky Cart Drawer Bar for QR Orders */}
      {totalItemsCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            width: '90%',
            maxWidth: '540px'
          }}
        >
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #B82E2E 0%, #8C1C1C 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 15px 35px rgba(184, 46, 46, 0.4)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#070605', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: '#F7F4EF' }}>
                {totalItemsCount}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', display: 'block' }}>
                  Keranjang Meja {tableId}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'serif' }}>
                  Rp {estimatedSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              <span>Lanjut Pemesanan</span>
              <ArrowRight size={18} />
            </div>
          </button>
        </motion.div>
      )}

      <Footer />
    </div>
  );
};
