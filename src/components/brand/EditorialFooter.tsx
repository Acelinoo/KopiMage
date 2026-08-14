'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Instagram, MapPin } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function EditorialFooter() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 pt-2 pb-6 max-w-[1440px] mx-auto">
      <footer
        style={{
          background: isDark ? '#0C0A09' : '#FFFFFF',
          borderColor: isDark ? 'rgba(243, 239, 234, 0.15)' : '#9E1F1F',
          color: isDark ? '#F3EFEA' : '#1A1A1A',
        }}
        className="border pt-16 pb-12 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="editorial-container">
          {/* Upper Brand Statement */}
          <div
            style={{
              borderBottomColor: isDark ? 'rgba(243, 239, 234, 0.1)' : 'rgba(158, 31, 31, 0.15)',
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b"
          >
            <div className="md:col-span-6 flex flex-col justify-between">
              <div>
                <span
                  style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                  className="font-serif text-3xl md:text-4xl tracking-[0.15em] block mb-4 font-bold"
                >
                  KOPIMAGE
                </span>
                <p
                  style={{ color: isDark ? '#9E9287' : '#555555' }}
                  className="font-serif italic text-xl md:text-2xl max-w-md font-light leading-relaxed"
                >
                  "A place to slow down, converse, and appreciate the honest art of hospitality."
                </p>
              </div>
              <div className="mt-8 pt-6">
                <span
                  style={{ color: isDark ? '#C29B7F' : '#9E1F1F' }}
                  className="font-sans text-[0.72rem] tracking-[0.2em] uppercase font-bold block mb-2"
                >
                  LOKASI &amp; JAM OPERASIONAL
                </span>
                <p style={{ color: isDark ? '#9E9287' : '#444444' }} className="font-sans text-sm font-light">
                  2 Cabang Resmi: Gading Tutuka (Soreang) &amp; Lanud Sulaiman (Margahayu)
                </p>
                <p style={{ color: isDark ? '#9E9287' : '#444444' }} className="font-sans text-sm font-light">
                  Buka Setiap Hari: 07.00 – 23.00 WIB
                </p>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col space-y-4">
              <span
                style={{ color: isDark ? '#9E9287' : '#9E1F1F' }}
                className="font-sans text-[0.72rem] tracking-[0.2em] uppercase mb-2 font-bold"
              >
                NAVIGASI
              </span>
              <Link
                href="#about"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="font-sans text-sm hover:opacity-75 transition-opacity w-fit"
              >
                ABOUT KOPIMAGE
              </Link>
              <Link
                href="#space"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="font-sans text-sm hover:opacity-75 transition-opacity w-fit"
              >
                THE SPACE
              </Link>
              <Link
                href="#experience"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="font-sans text-sm hover:opacity-75 transition-opacity w-fit"
              >
                THE EXPERIENCE
              </Link>
              <Link
                href="#visit"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="font-sans text-sm hover:opacity-75 transition-opacity w-fit"
              >
                VISIT 2 CABANG
              </Link>
            </div>

            <div className="md:col-span-3 flex flex-col space-y-4">
              <span
                style={{ color: isDark ? '#9E9287' : '#9E1F1F' }}
                className="font-sans text-[0.72rem] tracking-[0.2em] uppercase mb-2 font-bold"
              >
                HUBUNGI KAMI
              </span>
              <a
                href="https://instagram.com/kopimage"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="inline-flex items-center space-x-2 text-sm hover:opacity-75 transition-opacity w-fit"
              >
                <Instagram className="w-4 h-4 text-[#9E1F1F]" />
                <span>@kopimage</span>
                <ArrowUpRight style={{ color: isDark ? '#9E9287' : '#9E1F1F' }} className="w-3.5 h-3.5" />
              </a>
              <a
                href="#visit"
                style={{ color: isDark ? '#F3EFEA' : '#1A1A1A' }}
                className="inline-flex items-center space-x-2 text-sm hover:opacity-75 transition-opacity w-fit"
              >
                <MapPin className="w-4 h-4 text-[#9E1F1F]" />
                <span>Gading Tutuka &amp; Lanud Sulaiman</span>
              </a>
            </div>
          </div>

          {/* Lower Legal & Credit Bar */}
          <div
            style={{ color: isDark ? '#9E9287' : '#666666' }}
            className="pt-8 flex flex-col md:flex-row items-center justify-between font-sans text-xs space-y-4 md:space-y-0"
          >
            <div>
              &copy; {new Date().getFullYear()} KOPIMAGE. ALL RIGHTS RESERVED.
            </div>
            <div className="flex space-x-6 tracking-widest text-[0.65rem] uppercase font-medium">
              <span>Soreang &amp; Margahayu, Bandung</span>
              <span>•</span>
              <span>Industrial Coffee House</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default EditorialFooter;

