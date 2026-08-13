import React from 'react';
import Image from 'next/image';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialFooter } from '@/components/brand/EditorialFooter';
import { MapPin, Clock, Instagram, Phone, Car, Wifi, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const metadata = {
  title: 'Visit KOPIMAGE — Location, Operating Hours & Directions Soreang',
  description: 'Informasi praktis kunjungan KOPIMAGE Gading Tutuka Soreang. Lokasi, jam buka, parkir, dan rute.',
};

export default function VisitPage() {
  return (
    <div className="bg-[#0C0A09] text-[#F3EFEA] min-h-screen flex flex-col justify-between selection:bg-[#C29B7F] selection:text-[#0C0A09]">
      <EditorialHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="py-20 editorial-border-b">
          <div className="editorial-container">
            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-4">
              VISIT KOPIMAGE
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.95] max-w-4xl mb-6">
              We look forward to welcoming you.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#9E9287] max-w-xl font-light leading-relaxed">
              Panduan praktis kunjungan ke KOPIMAGE di kawasan Gading Tutuka, Soreang, Kabupaten Bandung.
            </p>
          </div>
        </section>

        {/* Practical Info Grid */}
        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column - Practical Details */}
              <div className="lg:col-span-6 space-y-12">
                {/* Location */}
                <div className="border-b border-[#F3EFEA]/10 pb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-[#C29B7F]" />
                    <span className="font-sans text-xs tracking-[0.2em] uppercase text-[#C29B7F]">
                      LOKASI KEDAI
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl text-[#F3EFEA] mb-3">
                    Gading Tutuka, Soreang
                  </h2>
                  <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed mb-6">
                    Jl. Gading Tutuka No. 88, Kecamatan Soreang, Kabupaten Bandung, Jawa Barat 40911
                  </p>
                  <a
                    href="https://maps.app.goo.gl/SS6748EDgyeR2Jgh9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-btn text-xs"
                  >
                    <span>BUKA GOOGLE MAPS</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Hours */}
                <div className="border-b border-[#F3EFEA]/10 pb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-[#C29B7F]" />
                    <span className="font-sans text-xs tracking-[0.2em] uppercase text-[#C29B7F]">
                      JAM OPERASIONAL
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl text-[#F3EFEA] mb-3">
                    Setiap Hari
                  </h2>
                  <p className="font-sans text-lg text-[#F3EFEA] font-light">
                    07.00 WIB – 23.00 WIB
                  </p>
                  <p className="font-sans text-xs text-[#9E9287] font-light mt-2">
                    *Last order dapur & penyeduhan kopi pukul 22.30 WIB.
                  </p>
                </div>

                {/* Contact */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Instagram className="w-5 h-5 text-[#C29B7F]" />
                    <span className="font-sans text-xs tracking-[0.2em] uppercase text-[#C29B7F]">
                      SOCIAL & KONTAK
                    </span>
                  </div>
                  <a
                    href="https://instagram.com/kopimage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-3xl text-[#F3EFEA] hover:text-[#C29B7F] transition-colors block mb-2"
                  >
                    @kopimage ↗
                  </a>
                  <p className="font-sans text-sm text-[#9E9287] font-light">
                    Ikuti update mingguan, informasi beans terbaru, dan suasana Soreang di Instagram kami.
                  </p>
                </div>
              </div>

              {/* Right Column - Amenities & Directions */}
              <div className="lg:col-span-6 space-y-12">
                {/* How to reach */}
                <div className="p-8 border border-[#F3EFEA]/10 bg-[#0C0A09]">
                  <h3 className="font-serif text-2xl text-[#F3EFEA] mb-4">Cara Menuju Lokasi</h3>
                  <div className="space-y-4 font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                    <p>
                      <strong className="text-[#F3EFEA] font-normal">Dari Tol Seroja:</strong> Ambil pintu keluar Tol Soreang, kemudian mengarah ke Jl. Raya Soreang - Banjaran menuju kawasan Gading Tutuka (sekitar 7-10 menit perjalanan).
                    </p>
                    <p>
                      <strong className="text-[#F3EFEA] font-normal">Dari Pusat Kota Soreang / Pemkab:</strong> Berjarak kurang lebih 5 menit dari kompleks Pemkab Bandung.
                    </p>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl text-[#F3EFEA]">Fasilitas Kunjungan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-[#F3EFEA]/10 bg-[#0C0A09] flex items-start gap-3">
                      <Car className="w-5 h-5 text-[#C29B7F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans text-xs text-[#F3EFEA] font-medium block">Area Parkir Wide</span>
                        <span className="font-sans text-[0.75rem] text-[#9E9287] font-light">
                          Tersedia lahan parkir mobil & sepeda motor yang aman.
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-[#F3EFEA]/10 bg-[#0C0A09] flex items-start gap-3">
                      <Wifi className="w-5 h-5 text-[#C29B7F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans text-xs text-[#F3EFEA] font-medium block">High-Speed WiFi</span>
                        <span className="font-sans text-[0.75rem] text-[#9E9287] font-light">
                          Koneksi internet cepat untuk menunjang aktivitas kerja.
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-[#F3EFEA]/10 bg-[#0C0A09] flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#C29B7F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans text-xs text-[#F3EFEA] font-medium block">Stopkontak Melimpah</span>
                        <span className="font-sans text-[0.75rem] text-[#9E9287] font-light">
                          Tersedia di hampir seluruh sudut meja indoor & teras.
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-[#F3EFEA]/10 bg-[#0C0A09] flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#C29B7F] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans text-xs text-[#F3EFEA] font-medium block">Pet Friendly Terrace</span>
                        <span className="font-sans text-[0.75rem] text-[#9E9287] font-light">
                          Area teras outdoor ramah buat hewan peliharaanmu.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Image Showcase */}
        <section className="py-20 editorial-border-b">
          <div className="editorial-container">
            <div className="editorial-img-wrapper h-[450px] sm:h-[600px] w-full">
              <Image
                src="/images/kopimage_hero_atmosphere_1786480906850.png"
                alt="Kedai KOPIMAGE Gading Tutuka Soreang"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
