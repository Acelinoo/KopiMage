'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Instagram, MapPin } from 'lucide-react';

export function EditorialFooter() {
  return (
    <footer className="bg-[#0C0A09] border-t border-[#F3EFEA]/10 text-[#F3EFEA] pt-20 pb-12">
      <div className="editorial-container">
        {/* Upper Brand Statement */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#F3EFEA]/10">
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <span className="font-serif text-3xl md:text-4xl tracking-[0.15em] block mb-4 text-[#F3EFEA]">
                KOPIMAGE
              </span>
              <p className="font-serif italic text-xl md:text-2xl text-[#9E9287] max-w-md font-light leading-relaxed">
                "A place to slow down, converse, and appreciate the honest art of hospitality."
              </p>
            </div>
            <div className="mt-8 pt-6">
              <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#C29B7F] font-semibold block mb-2">
                LOKASI & JAM OPERASIONAL
              </span>
              <p className="font-sans text-sm text-[#9E9287]">
                2 Cabang Resmi: Gading Tutuka (Soreang) & Lanud Sulaiman (Margahayu)
              </p>
              <p className="font-sans text-sm text-[#9E9287]">
                Buka Setiap Hari: 07.00 – 23.00 WIB
              </p>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col space-y-4">
            <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#9E9287] mb-2 font-semibold">
              NAVIGASI
            </span>
            <Link href="#about" className="font-sans text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit">
              ABOUT KOPIMAGE
            </Link>
            <Link href="#space" className="font-sans text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit">
              THE SPACE
            </Link>
            <Link href="#experience" className="font-sans text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit">
              THE EXPERIENCE
            </Link>
            <Link href="#visit" className="font-sans text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit">
              VISIT 2 CABANG
            </Link>
          </div>

          <div className="md:col-span-3 flex flex-col space-y-4">
            <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#9E9287] mb-2 font-semibold">
              HUBUNGI KAMI
            </span>
            <a
              href="https://instagram.com/kopimage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit"
            >
              <Instagram className="w-4 h-4 text-[#C29B7F]" />
              <span>@kopimage</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#9E9287]" />
            </a>
            <a
              href="#visit"
              className="inline-flex items-center space-x-2 text-sm text-[#F3EFEA]/80 hover:text-[#C29B7F] transition-colors w-fit"
            >
              <MapPin className="w-4 h-4 text-[#B82E2E]" />
              <span>Gading Tutuka & Lanud Sulaiman</span>
            </a>
          </div>
        </div>

        {/* Lower Legal & Credit Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between font-sans text-xs text-[#9E9287] space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} KOPIMAGE. ALL RIGHTS RESERVED.
          </div>
          <div className="flex space-x-6 tracking-widest text-[0.65rem] uppercase">
            <span>Soreang & Margahayu, Bandung</span>
            <span>•</span>
            <span>Industrial Coffee House</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
