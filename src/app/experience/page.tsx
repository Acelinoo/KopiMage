import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialFooter } from '@/components/brand/EditorialFooter';
import { QrCode, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'The Experience — KOPIMAGE Table QR & Hospitality',
  description: 'Pengalaman pelayanan meja tanpa antrean di KOPIMAGE Soreang.',
};

export default function ExperiencePage() {
  return (
    <div className="bg-[#0C0A09] text-[#F3EFEA] min-h-screen flex flex-col justify-between selection:bg-[#C29B7F] selection:text-[#0C0A09]">
      <EditorialHeader />

      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="py-20 editorial-border-b">
          <div className="editorial-container">
            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-4">
              THE EXPERIENCE
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.95] max-w-4xl mb-6">
              Your table is your menu.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#9E9287] max-w-xl font-light leading-relaxed">
              Kami mendesain pengalaman pemesanan yang tenang agar Anda dapat menikmati waktu berharga Anda tanpa perlu berdiri di antrean kasir.
            </p>
          </div>
        </section>

        {/* Four Steps Breakdown */}
        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="space-y-24">
              {/* Step 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#F3EFEA]/10">
                <div className="lg:col-span-5">
                  <span className="font-serif text-6xl text-[#C29B7F]/40 block mb-4">01</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-light mb-4">ARRIVE</h2>
                  <h3 className="font-serif italic text-2xl text-[#C29B7F] mb-6">Take a seat.</h3>
                  <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                    Setibanya Anda di KOPIMAGE Gading Tutuka Soreang, silakan memilih tempat duduk yang paling sesuai dengan suasana hati Anda—baik di area indoor ber-AC maupun di teras outdoor yang sejuk.
                  </p>
                </div>
                <div className="lg:col-span-7 editorial-img-wrapper h-[400px]">
                  <Image
                    src="/images/kopimage_space_terrace_1786480961312.png"
                    alt="Arrive at KOPIMAGE"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#F3EFEA]/10">
                <div className="lg:col-span-7 order-2 lg:order-1 editorial-img-wrapper h-[400px]">
                  <Image
                    src="/images/kopimage_hero_atmosphere_1786480906850.png"
                    alt="Scan QR code at table"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                  <span className="font-serif text-6xl text-[#C29B7F]/40 block mb-4">02</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-light mb-4">SCAN</h2>
                  <h3 className="font-serif italic text-2xl text-[#C29B7F] mb-6">Your table is your menu.</h3>
                  <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed mb-4">
                    Di atas setiap meja terdapat pelat akrilik kode QR yang terhubung langsung dengan nomor meja Anda. Cukup buka kamera smartphone Anda dan pindai kode tersebut.
                  </p>
                  <div className="p-4 border border-[#C29B7F]/30 bg-[#0C0A09] flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-[#C29B7F]" />
                    <span className="font-sans text-xs text-[#F3EFEA] tracking-wider uppercase">
                      Tanpa Perlu Mengunduh Aplikasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 border-b border-[#F3EFEA]/10">
                <div className="lg:col-span-5">
                  <span className="font-serif text-6xl text-[#C29B7F]/40 block mb-4">03</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-light mb-4">CHOOSE</h2>
                  <h3 className="font-serif italic text-2xl text-[#C29B7F] mb-6">Take your time.</h3>
                  <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                    Jelajahi pilihan racikan kopi susu signature, manual brew beans pilihan, minuman non-kopi, kudapan, hingga makanan utama hangat. Pilih opsi kustomisasi takaran gula atau ice level sesuai selera Anda.
                  </p>
                </div>
                <div className="lg:col-span-7 editorial-img-wrapper h-[400px]">
                  <Image
                    src="/images/kopimage_food_table_1786480947275.png"
                    alt="Choose from menu"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 order-2 lg:order-1 editorial-img-wrapper h-[400px]">
                  <Image
                    src="/images/kopimage_barista_pouring_1786480929425.png"
                    alt="Enjoy hospitality at table"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                </div>
                <div className="lg:col-span-5 order-1 lg:order-2">
                  <span className="font-serif text-6xl text-[#C29B7F]/40 block mb-4">04</span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-light mb-4">ENJOY</h2>
                  <h3 className="font-serif italic text-2xl text-[#C29B7F] mb-6">Stay as long as you want.</h3>
                  <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed mb-6">
                    Lakukan konfirmasi pesanan via sistem. Tim barista & dapur KOPIMAGE akan segera memproses pesanan dan mengantarkannya langsung ke meja Anda.
                  </p>
                  <Link href="/visit" className="editorial-btn">
                    <span>KUNJUNGI KOPIMAGE SOREANG</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
