import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialFooter } from '@/components/brand/EditorialFooter';

export const metadata = {
  title: 'The Space — KOPIMAGE Architecture & Atmosphere',
  description: 'Eksplorasi arsitektur, teras luar ruangan, dan ketenangan suasana KOPIMAGE Soreang.',
};

export default function SpacePage() {
  return (
    <div className="bg-[#0C0A09] text-[#F3EFEA] min-h-screen flex flex-col justify-between selection:bg-[#C29B7F] selection:text-[#0C0A09]">
      <EditorialHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="py-20 editorial-border-b">
          <div className="editorial-container">
            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-4">
              THE SPACE
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.95] max-w-4xl mb-6">
              A place designed to slow down.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#9E9287] max-w-xl font-light leading-relaxed">
              Arsitektur KOPIMAGE dirancang untuk merespons cahaya alami sepanjang hari, menciptakan atmosfer yang terus bertransformasi secara alami.
            </p>
          </div>
        </section>

        {/* Daylight Essay: Morning */}
        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#F3EFEA]/10">
              <div>
                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-2">
                  01 / MORNING (07:00 - 12:00)
                </span>
                <h2 className="font-serif text-4xl sm:text-6xl font-light">
                  Cahaya Pagi & Ketenangan Seduhan
                </h2>
              </div>
              <p className="font-sans text-xs text-[#9E9287] tracking-widest uppercase mt-4 md:mt-0">
                Soreang Fresh Air • Quiet Hours
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 editorial-img-wrapper h-[450px] sm:h-[600px]">
                <Image
                  src="/images/kopimage_space_morning.png"
                  alt="KOPIMAGE Morning Sunlight Space"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
              <div className="lg:col-span-4 lg:pl-4 space-y-6">
                <span className="font-serif text-3xl text-[#F3EFEA] block font-light">
                  Matahari Terbit di Gading Tutuka
                </span>
                <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                  Pagi hari di KOPIMAGE diwarnai oleh sinar matahari lembut yang menembus celah jendela tinggi, memantul di atas meja kayu gelap dan lantai semen.
                </p>
                <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                  Waktu terbaik untuk menikmati segelas Manual Brew hangat sambil membaca atau memulai hari dengan tenang.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daylight Essay: Afternoon */}
        <section className="py-24 editorial-border-b">
          <div className="editorial-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#F3EFEA]/10">
              <div>
                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-2">
                  02 / AFTERNOON (12:00 - 17:30)
                </span>
                <h2 className="font-serif text-4xl sm:text-6xl font-light">
                  Teras Terbuka & Angin Soreang
                </h2>
              </div>
              <p className="font-sans text-xs text-[#9E9287] tracking-widest uppercase mt-4 md:mt-0">
                Outdoor Terrace • Open Breezes
              </p>
            </div>

            <div className="editorial-img-wrapper h-[550px] sm:h-[700px] w-full mb-12">
              <Image
                src="/images/kopimage_space_terrace_1786480961312.png"
                alt="Teras KOPIMAGE Soreang"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[#9E9287] font-light text-sm leading-relaxed">
              <div>
                <h3 className="font-serif text-2xl text-[#F3EFEA] mb-3">Teras Luar Ruangan</h3>
                <p>
                  Area teras outdoor menawarkan sirkulasi udara bebas dengan pepohonan hijau yang menyejukkan. Tempat ideal untuk bertemu teman, berdiskusi santai, atau sekadar menikmati semilir angin sore khas Soreang.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-[#F3EFEA] mb-3">Kenyamanan Bekerja</h3>
                <p>
                  Setiap sudut meja dilengkapi dengan akses listrik dan pencahayaan yang pas, menjadikannya pilihan favorit para pekerja kreatif untuk fokus berkarya.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daylight Essay: Night */}
        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#F3EFEA]/10">
              <div>
                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-2">
                  03 / NIGHT (17:30 - 23:00)
                </span>
                <h2 className="font-serif text-4xl sm:text-6xl font-light">
                  Pencahayaan Hangat & Suasana Intim
                </h2>
              </div>
              <p className="font-sans text-xs text-[#9E9287] tracking-widest uppercase mt-4 md:mt-0">
                Warm Glow • Evening Conversations
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="font-serif text-3xl text-[#F3EFEA] block font-light">
                  Ketenangan Malam Hari
                </span>
                <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                  Saat malam tiba, KOPIMAGE bertransformasi menjadi ruang berteduh yang intim. Lampu-lampu berpendar hangat menciptakan kontras yang indah terhadap kegelapan malam.
                </p>
                <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed">
                  Diiringi lagu-lagu tenang dan aroma makanan hangat dari dapur, malam di KOPIMAGE adalah tempat terbaik untuk menutup hari.
                </p>
              </div>
              <div className="lg:col-span-7 editorial-img-wrapper h-[450px] sm:h-[600px]">
                <Image
                  src="/images/kopimage_space_night.png"
                  alt="KOPIMAGE Evening Atmosphere"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
