'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, ArrowUpRight, QrCode, Sun, Moon } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function EditorialHeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const navItems = [
    { label: 'ABOUT', href: '#about' },
    { label: 'MENU', href: '#menu' },
    { label: 'SPACE', href: '#space' },
    { label: 'EXPERIENCE', href: '#experience' },
    { label: 'VISIT', href: '#visit' },
  ];

  return (
    <>
      <header style={{ background: 'var(--bg-main)', borderColor: 'var(--border-color)' }} className="sticky top-0 z-40 backdrop-blur-md editorial-border-b transition-all duration-300 border-b">
        <div className="editorial-container flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link href={tableId ? `/?table=${tableId}` : '/'} className="flex flex-col group">
            <span className="font-serif text-2xl tracking-[0.2em] font-normal text-[#F3EFEA] group-hover:text-[#B82E2E] transition-colors">
              KOPIMAGE
            </span>
            <span className="font-sans text-[0.65rem] tracking-[0.2em] uppercase text-[#9E9287]">
              Gading Tutuka • Soreang
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => {
              const targetHref = tableId ? `/?table=${tableId}${item.href}` : `/${item.href}`;
              return (
                <a
                  key={item.href}
                  href={targetHref}
                  className="font-sans text-[0.75rem] tracking-[0.2em] text-[#9E9287] hover:text-[#F3EFEA] transition-colors relative py-1"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Action CTA Button */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {tableId ? (
              <Link
                href={`/?table=${tableId}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#B82E2E] text-[#F3EFEA] hover:bg-[#B82E2E] hover:border-[#B82E2E] text-[0.7rem] tracking-[0.18em] uppercase transition-all font-semibold rounded-lg shadow-sm"
              >
                <span>MEJA {tableId} MENU</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={() => setShowQRModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#B82E2E] text-[#F3EFEA] hover:bg-[#B82E2E] hover:border-[#B82E2E] text-[0.7rem] tracking-[0.18em] uppercase transition-all font-semibold rounded-lg shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-[#B82E2E] group-hover:text-[#F3EFEA]" />
                <span>SCAN QR DI MEJA</span>
              </button>
            )}
          </div>

          {/* Mobile Actions & Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F3EFEA] p-2 hover:text-[#B82E2E] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Editorial Drawer */}
      {mobileMenuOpen && (
        <div style={{ background: 'var(--bg-main)' }} className="fixed inset-0 top-20 z-30 flex flex-col justify-between p-6 sm:p-8 md:hidden border-t border-[#FFFFFF]/10 overflow-y-auto animate-fade-in">
          <div className="flex flex-col space-y-6 pt-4">
            {navItems.map((item) => {
              const targetHref = tableId ? `/?table=${tableId}${item.href}` : `/${item.href}`;
              return (
                <a
                  key={item.href}
                  href={targetHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-serif text-3xl tracking-wider text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors"
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="pt-8 border-t border-[#F3EFEA]/10 flex flex-col gap-4">
            {tableId ? (
              <Link
                href={`/?table=${tableId}`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-[#C29B7F] text-[#0C0A09] font-sans text-xs tracking-[0.18em] uppercase font-semibold"
              >
                PESAN DARI MEJA {tableId}
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowQRModal(true);
                }}
                className="w-full text-center py-3 border border-[#F3EFEA]/30 text-[#F3EFEA] font-sans text-xs tracking-[0.18em] uppercase"
              >
                SCAN QR AT TABLE
              </button>
            )}
            <p className="text-[0.7rem] text-[#9E9287] tracking-widest uppercase text-center mt-2">
              Gading Tutuka • Soreang • 07.00 - 23.00 WIB
            </p>
          </div>
        </div>
      )}

      {/* QR Info Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0A09]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14110F] border border-[#F3EFEA]/15 max-w-md w-full p-8 text-center relative shadow-2xl">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-[#9E9287] hover:text-[#F3EFEA]"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 border border-[#C29B7F]/40 flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-6 h-6 text-[#C29B7F]" />
            </div>
            <h3 className="font-serif text-2xl text-[#F3EFEA] mb-3">
              Hospitality via Table QR
            </h3>
            <p className="font-sans text-sm text-[#9E9287] leading-relaxed mb-6">
              Menu digital & sistem pemesanan KOPIMAGE hanya dapat diakses saat Anda berada di lokasi. Pindai kode QR yang tertera di atas meja Anda untuk mulai memilih sajian.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="#experience"
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 bg-[#F3EFEA] text-[#0C0A09] font-sans text-xs tracking-[0.15em] uppercase font-medium hover:bg-[#C29B7F] transition-colors block text-center"
              >
                PELAJARI EXPERIENCE KOPIMAGE
              </a>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 text-[#9E9287] hover:text-[#F3EFEA] font-sans text-xs tracking-[0.15em] uppercase"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function EditorialHeader() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-40 bg-[#0C0A09]/90 backdrop-blur-md editorial-border-b h-20">
        <div className="editorial-container flex items-center justify-between h-full">
          <div className="font-serif text-2xl tracking-[0.2em] text-[#F3EFEA]">KOPIMAGE</div>
        </div>
      </header>
    }>
      <EditorialHeaderContent />
    </Suspense>
  );
}
