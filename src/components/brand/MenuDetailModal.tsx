'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, Sparkles, Thermometer, MapPin, QrCode, ArrowRight, CheckCircle2, Flame } from 'lucide-react';
import { MenuItem } from '../../types/menu';

interface MenuDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const displayPrice = item.price.includes('K') || item.price.includes('Rp') ? item.price : `Rp ${item.price}`;
  const isDrink = item.category === 'coffee' || item.category === 'non-coffee' || item.category === 'seasonal';

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0E0B0A]/85 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-[#161210] border border-[#B82E2E]/40 rounded-3xl overflow-hidden shadow-2xl z-10 my-auto text-[#FFFFFF]"
          >
            {/* Close Floating Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#0E0B0A]/80 text-[#A89F91] hover:text-[#FFFFFF] hover:bg-[#B82E2E] border border-[#FFFFFF]/10 transition-all cursor-pointer shadow-md"
              aria-label="Tutup Detail Menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Body: Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left Column: Big Image Display */}
              <div className="md:col-span-5 relative h-64 md:h-full min-h-[260px] bg-[#0E0B0A] border-b md:border-b-0 md:border-r border-[#FFFFFF]/10 flex items-center justify-center overflow-hidden group">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#A89F91] p-6 text-center">
                    <Coffee className="w-12 h-12 text-[#B82E2E] mb-2" />
                    <span className="font-serif text-sm">Kopi Mage Authentic</span>
                  </div>
                )}
                {item.isBestSeller && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-[#B82E2E] text-[#FFFFFF] text-[0.65rem] font-sans tracking-widest uppercase font-semibold rounded-md shadow-md border border-[#B82E2E]">
                    ⭐ BEST SELLER
                  </span>
                )}
              </div>

              {/* Right Column: Menu Details & Information */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* Category Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2.5 py-1 bg-[#B82E2E]/20 text-[#C29B7F] text-[0.62rem] font-sans tracking-wider uppercase font-semibold rounded-md border border-[#B82E2E]/30">
                      {item.category === 'coffee' ? 'KOPI RACIKAN' : item.category === 'main-course' ? 'MAKANAN UTAMA' : item.category === 'non-coffee' ? 'NON-COFFEE' : 'SPESIAL KOPI MAGE'}
                    </span>
                    {item.temperature && (
                      <span className="px-2.5 py-1 bg-[#FFFFFF]/08 text-[#A89F91] text-[0.62rem] font-sans tracking-wider uppercase font-medium rounded-md border border-[#FFFFFF]/10 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-[#B82E2E]" />
                        {item.temperature}
                      </span>
                    )}
                  </div>

                  {/* Menu Title */}
                  <h2 className="font-serif text-2xl sm:text-3xl font-light text-[#FFFFFF] mb-2 leading-tight">
                    {item.name}
                  </h2>

                  {/* Price Tag */}
                  <div className="mb-4">
                    <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[#A89F91] block">HARGA RESMI</span>
                    <span className="font-serif text-2xl font-semibold text-[#C29B7F]">
                      {displayPrice}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="font-sans text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed mb-6 border-t border-[#FFFFFF]/08 pt-4">
                    {item.description || 'Racikan khas Kopi Mage dengan bahan pilihan. Diracik langsung oleh barista kami biar rasanya selalu pas di lidahmu.'}
                  </p>

                  {/* Item Features / Specs */}
                  <div className="bg-[#0E0B0A] border border-[#FFFFFF]/08 rounded-xl p-4 mb-6 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-[#FFFFFF]">
                      <CheckCircle2 className="w-4 h-4 text-[#B82E2E] shrink-0" />
                      <span>Tersedia di <strong>Cabang Gading Tutuka & Lanud Sulaiman</strong></span>
                    </div>
                    {isDrink && (
                      <div className="flex items-center gap-2.5 text-xs text-[#A89F91]">
                        <Flame className="w-4 h-4 text-[#C29B7F] shrink-0" />
                        <span>Karakter Rasa: <strong>Pas di lidah, rasa konsisten & segar</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Area */}
                <div className="pt-4 border-t border-[#FFFFFF]/08 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href="#experience"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#B82E2E] text-[#FFFFFF] hover:bg-[#D63434] transition-colors text-xs font-sans tracking-wider uppercase font-semibold text-center w-full shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>PESAN DI MEJA (SCAN QR)</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MenuDetailModal;
