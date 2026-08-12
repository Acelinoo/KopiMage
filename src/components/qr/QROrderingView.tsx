'use client';

import React, { useState, useMemo } from 'react';
import { CATEGORIES, MENU_ITEMS } from '@/data/menuData';
import { MenuCategoryId, MenuItem } from '@/types/menu';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Search, Sparkles, Filter, X, ShoppingBag, ArrowRight, MapPin } from 'lucide-react';

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
    <div style={{ background: '#0F0D0C', color: '#F7F4EF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero Table Banner */}
      <section style={{ paddingTop: '8rem', paddingBottom: '3rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(198, 125, 90, 0.18) 0%, rgba(15, 13, 12, 0) 75%)', borderBottom: '1px solid rgba(212, 163, 115, 0.12)' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            
            {/* Table Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                background: 'rgba(212, 163, 115, 0.15)',
                border: '1px solid rgba(212, 163, 115, 0.4)',
                color: '#D4A373',
                fontSize: '0.9rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                marginBottom: '1.25rem'
              }}
            >
              <MapPin size={16} />
              <span>SISTEM PEMESANAN MEJA {tableId}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#F7F4EF', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Selamat Datang di <span style={{ background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Meja {tableId}</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#C4BBB4', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
              Pilih racikan kopi murni, minuman segar, cemilan, dan makanan berat favorit Anda. Pesanan akan diantar langsung ke Meja {tableId}.
            </p>

          </div>
        </div>
      </section>

      {/* Main Menu Catalog Section */}
      <section id="menu" style={{ padding: '4rem 0 7rem 0', flex: 1 }}>
        <div className="container">
          
          {/* Search & Category Filter Controls */}
          <div style={{ maxWidth: '880px', margin: '0 auto 3rem auto' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Cari kopi, buncis pedas, mie julid, es kopi susu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 3.2rem',
                  fontSize: '0.98rem',
                  background: '#161311',
                  border: '1px solid rgba(212, 163, 115, 0.25)',
                  borderRadius: 'var(--radius-full)',
                  color: '#F7F4EF',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <Search
                size={20}
                color="#8E847C"
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
                    color: '#8E847C',
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
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      border: isActive ? '1px solid #D4A373' : '1px solid rgba(212, 163, 115, 0.12)',
                      background: isActive ? 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)' : '#161311',
                      color: isActive ? '#0F0D0C' : '#C4BBB4',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Filter Status Text */}
          <div style={{ marginBottom: '2rem', textAlign: 'center', color: '#8E847C', fontSize: '0.9rem' }}>
            Menampilkan <strong style={{ color: '#D4A373' }}>{filteredItems.length}</strong> menu untuk{' '}
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
                borderRadius: 'var(--radius-lg)',
                maxWidth: '500px',
                margin: '0 auto',
                background: '#161311',
                border: '1px solid rgba(212, 163, 115, 0.15)'
              }}
            >
              <Filter size={40} color="#D4A373" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#F7F4EF', marginBottom: '0.5rem' }}>Menu Tidak Ditemukan</h3>
              <p style={{ color: '#C4BBB4', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
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

      {/* Floating Bottom Cart Bar (Visible when cart has items) */}
      {totalItemsCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '500px',
            zIndex: 800,
            background: 'linear-gradient(135deg, #1E1A17 0%, #161311 100%)',
            border: '1px solid #D4A373',
            borderRadius: '9999px',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
            cursor: 'pointer',
          }}
          onClick={() => setIsCartOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#D4A373', color: '#0F0D0C', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
              {totalItemsCount}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#8E847C' }}>Keranjang Belanja</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#D4A373' }}>
                Rp {estimatedSubtotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <button
            style={{
              background: 'linear-gradient(135deg, #D4A373 0%, #C67D5A 100%)',
              color: '#0F0D0C',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.5rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Buka Keranjang</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};
