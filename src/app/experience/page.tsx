'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialFooter } from '@/components/brand/EditorialFooter';
import { QrCode, ArrowRight, CheckCircle2, Coffee, Sparkles, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ExperienceContent() {
  const searchParams = useSearchParams();
  const rawTable = searchParams.get('table') || searchParams.get('meja') || '07';

  const [selectedTable, setSelectedTable] = useState<string>(rawTable.padStart(2, '0'));
  const [selectedOutlet, setSelectedOutlet] = useState<'gading' | 'lanud'>('gading');

  useEffect(() => {
    if (rawTable) {
      setSelectedTable(rawTable.padStart(2, '0'));
    }
  }, [rawTable]);

  const availableTables = [
    { code: '01', area: 'Indoor AC' },
    { code: '02', area: 'Indoor AC' },
    { code: '03', area: 'Indoor AC' },
    { code: '04', area: 'Outdoor Teras' },
    { code: '05', area: 'Outdoor Teras' },
    { code: '06', area: 'Outdoor Teras' },
    { code: '07', area: 'VIP Bar' },
    { code: '08', area: 'VIP Bar' },
    { code: '09', area: 'Soreang Garden' },
    { code: '10', area: 'Soreang Garden' },
    { code: '11', area: 'Sulaiman Airfield' },
    { code: '12', area: 'Sulaiman Airfield' },
  ];

  return (
    <div className="bg-[#0E0B0A] text-[#FFFFFF] min-h-screen flex flex-col justify-between selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      <EditorialHeader />

      <main className="flex-1">
        {/* Table Connected Live Banner */}
        <div className="bg-gradient-to-r from-[#B82E2E]/20 via-[#161210] to-[#B82E2E]/20 border-b border-[#B82E2E]/30 py-4 px-4 sm:px-8">
          <div className="editorial-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B82E2E] flex items-center justify-center shrink-0 shadow-md">
                <QrCode className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[0.65rem] tracking-widest uppercase font-semibold text-[#C29B7F]">TERHUBUNG SISTEM QR MEJA</span>
                </div>
                <h2 className="text-sm sm:text-base font-serif font-medium text-white">
                  Anda Berada di <strong className="text-[#C29B7F]">MEJA {selectedTable}</strong> • Cabang {selectedOutlet === 'gading' ? 'Gading Tutuka Soreang' : 'Lanud Sulaiman Margahayu'}
                </h2>
              </div>
            </div>

            <a
              href="/#menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-sans tracking-wider uppercase font-semibold transition-colors shadow-md w-full sm:w-auto text-center justify-center cursor-pointer"
            >
              <span>BUKA MENU MEJA {selectedTable} &amp; PESAN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Page Hero Header */}
        <section className="py-16 sm:py-20 editorial-border-b bg-[#0E0B0A]">
          <div className="editorial-container">
            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
              01 / MEJA ADALAH MENU ANDA
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.05] max-w-4xl mb-6 text-white">
              Your table is your menu.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#A89F91] max-w-2xl font-light leading-relaxed mb-8">
              Kami mendesain pengalaman pemesanan yang tenang agar Anda dapat menikmati waktu berharga Anda tanpa perlu berdiri di antrean kasir. Cukup duduk santai, scan kode QR di meja, dan racikan kopi hangat disajikan langsung ke tempat duduk Anda.
            </p>

            {/* Table Simulator Switcher */}
            <div className="p-6 rounded-2xl bg-[#161210] border border-[#B82E2E]/30 max-w-3xl">
              <span className="text-[0.65rem] tracking-widest uppercase font-semibold text-[#C29B7F] block mb-3">
                SIMULASI SCANNING KODE QR MEJA KOPIMAGE:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTables.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => setSelectedTable(t.code)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif transition-all cursor-pointer border ${
                      selectedTable === t.code
                        ? 'bg-[#B82E2E] text-white border-[#B82E2E] shadow-md font-semibold'
                        : 'bg-[#0E0B0A] text-[#A89F91] border-[#FFFFFF]/10 hover:text-white hover:border-[#B82E2E]/40'
                    }`}
                  >
                    <span>MEJA {t.code}</span>
                    <span className="text-[0.6rem] block text-opacity-70 opacity-75">{t.area}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Four Steps Breakdown */}
        <section className="py-20 lg:py-24 editorial-border-b bg-[#161210]">
          <div className="editorial-container">
            <div className="space-y-20">
              {/* Step 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#FFFFFF]/10">
                <div className="lg:col-span-5">
                  <span className="font-serif text-6xl text-[#B82E2E]/40 font-light block mb-4">01</span>
                  <h2 className="font-serif text-3xl sm:text-5xl font-light mb-2 text-white">ARRIVE</h2>
                  <h3 className="font-serif italic text-xl text-[#C29B7F] mb-6">Pilih Tempat Duduk Nyaman.</h3>
                  <p className="font-sans text-sm text-[#A89F91] font-light leading-relaxed mb-6">
                    Setibanya Anda di KOPIMAGE (Gading Tutuka Soreang atau Lanud Sulaiman Margahayu), silakan memilih tempat duduk yang paling sesuai—baik di area indoor ber-AC yang tenang maupun di teras outdoor yang sejuk.
                  </p>
                  <div className="p-4 rounded-xl border border-[#FFFFFF]/08 bg-[#0E0B0A] flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#B82E2E] shrink-0" />
                    <span className="text-xs text-[#A89F91]">
                      Tersedia colokan di tiap meja &amp; WiFi kencang buat nugas.
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-7 editorial-img-wrapper h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-[#FFFFFF]/10 relative">
                  <Image
                    src="/images/kopimage_space_terrace_1786480961312.png"
                    alt="Arrive at KOPIMAGE"
                    fill
                    loading="eager"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#FFFFFF]/10">
                <div className="lg:col-span-7 order-2 lg:order-1 editorial-img-wrapper h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-[#FFFFFF]/10 relative">
                  <Image
                    src="/images/kopimage_hero_atmosphere_1786480906850.png"
                    alt="Scan QR code at table"
                    fill
                    loading="eager"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                  <span className="font-serif text-6xl text-[#B82E2E]/40 font-light block mb-4">02</span>
                  <h2 className="font-serif text-3xl sm:text-5xl font-light mb-2 text-white">SCAN</h2>
                  <h3 className="font-serif italic text-xl text-[#C29B7F] mb-6">Pindai Barcode di Meja.</h3>
                  <p className="font-sans text-sm text-[#A89F91] font-light leading-relaxed mb-6">
                    Di atas setiap meja terdapat pelat akrilik kode QR yang terhubung langsung dengan nomor meja Anda (seperti <strong className="text-white">MEJA {selectedTable}</strong>). Cukup buka kamera smartphone Anda tanpa perlu mengunduh aplikasi tambahan.
                  </p>
                  <div className="p-4 border border-[#B82E2E]/30 bg-[#0E0B0A] rounded-xl flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-[#B82E2E]" />
                    <span className="font-sans text-xs text-white tracking-wider uppercase font-semibold">
                      Sistem Langsung Terhubung ke Meja {selectedTable}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#FFFFFF]/10">
                <div className="lg:col-span-5">
                  <span className="font-serif text-6xl text-[#B82E2E]/40 font-light block mb-4">03</span>
                  <h2 className="font-serif text-3xl sm:text-5xl font-light mb-2 text-white">CHOOSE</h2>
                  <h3 className="font-serif italic text-xl text-[#C29B7F] mb-6">Pilih Menu Favorit.</h3>
                  <p className="font-sans text-sm text-[#A89F91] font-light leading-relaxed mb-6">
                    Jelajahi pilihan racikan kopi susu signature, manual brew beans pilihan, minuman non-kopi, kudapan hangat, hingga makanan utama. Sesuaikan takaran gula atau ice level sesuai selera Anda.
                  </p>
                  <a
                    href="/#menu"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B82E2E] text-white text-xs font-sans tracking-wider uppercase font-semibold hover:bg-[#D63434] transition-colors shadow-sm"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>LIHAT MENU BEST SELLER</span>
                  </a>
                </div>
                <div className="lg:col-span-7 editorial-img-wrapper h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-[#FFFFFF]/10 relative">
                  <Image
                    src="/images/kopimage_food_table_1786480947275.png"
                    alt="Choose from menu"
                    fill
                    loading="eager"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 order-2 lg:order-1 editorial-img-wrapper h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-[#FFFFFF]/10 relative">
                  <Image
                    src="/images/kopimage_barista_pouring_1786480929425.png"
                    alt="Enjoy hospitality at table"
                    fill
                    loading="eager"
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                  <span className="font-serif text-6xl text-[#B82E2E]/40 font-light block mb-4">04</span>
                  <h2 className="font-serif text-3xl sm:text-5xl font-light mb-2 text-white">ENJOY</h2>
                  <h3 className="font-serif italic text-xl text-[#C29B7F] mb-6">Nikmati Suasana Tanpa Antre.</h3>
                  <p className="font-sans text-sm text-[#A89F91] font-light leading-relaxed mb-6">
                    Setelah pesanan dikirim, tim barista dan dapur kami langsung meracik sajian Anda dan mengantarkannya langsung ke meja Anda. Bersantai, mengobrol, atau menikmati live music weekend di KOPIMAGE.
                  </p>
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300">
                      Pelayanan Meja Cepat, Higenis &amp; Ramah Hospitality.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}

export default function ExperiencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E0B0A] text-white flex items-center justify-center p-8">
        <span className="font-serif text-sm tracking-widest uppercase text-[#C29B7F] animate-pulse">Memuat Pengalaman Meja KOPIMAGE...</span>
      </div>
    }>
      <ExperienceContent />
    </Suspense>
  );
}
