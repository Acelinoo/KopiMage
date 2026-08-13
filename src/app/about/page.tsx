import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialFooter } from '@/components/brand/EditorialFooter';
import { ArrowUpRight } from 'lucide-react';

export const metadata = {
  title: 'About KOPIMAGE — Hospitality & Coffee Culture in Soreang',
  description: 'Filosofi, sejarah, dan nilai utama di balik KOPIMAGE Gading Tutuka Soreang.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#0C0A09] text-[#F3EFEA] min-h-screen flex flex-col justify-between selection:bg-[#C29B7F] selection:text-[#0C0A09]">
      <EditorialHeader />

      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="py-20 editorial-border-b">
          <div className="editorial-container">
            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] block mb-4">
              ABOUT KOPIMAGE
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.95] max-w-4xl">
              We exist to create space for genuine moments.
            </h1>
          </div>
        </section>

        {/* Narrative Sections */}
        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 border-t border-[#F3EFEA]/10 pt-6">
                <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#C29B7F] block mb-2">
                  01 / WHY WE EXIST
                </span>
                <h2 className="font-serif text-3xl text-[#F3EFEA]">
                  Alasan KOPIMAGE Hadir
                </h2>
              </div>
              <div className="lg:col-span-8 border-t border-[#F3EFEA]/10 pt-6 space-y-6 text-[#9E9287] font-light text-base leading-relaxed">
                <p>
                  Di tengah laju kehidupan modern yang serba cepat dan transaksi yang instan, kami merasa ada kebutuhan mendasar yang sering terabaikan: <strong className="text-[#F3EFEA] font-normal">ruang untuk bernapas dan melambat</strong>.
                </p>
                <p>
                  KOPIMAGE didirikan dengan visi sederhana namun tegas: menghadirkan tempat hospitality di Soreang yang kebetulan menyajikan kopi dan hidangan berkualitas tinggi. Kami tidak mengejar kecepatan putaran meja, melainkan kedalaman pengalaman setiap tamu yang melangkah masuk.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 editorial-border-b">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 border-t border-[#F3EFEA]/10 pt-6">
                <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#C29B7F] block mb-2">
                  02 / WHERE WE STARTED
                </span>
                <h2 className="font-serif text-3xl text-[#F3EFEA]">
                  Awal Berdiri di Gading Tutuka
                </h2>
              </div>
              <div className="lg:col-span-8 border-t border-[#F3EFEA]/10 pt-6 space-y-6 text-[#9E9287] font-light text-base leading-relaxed">
                <p>
                  Bermula dari kecintaan mendalam terhadap kultur kopi lokal di Kabupaten Bandung, kami memilih kawasan Gading Tutuka, Soreang sebagai rumah utama KOPIMAGE.
                </p>
                <p>
                  Kami merancang setiap sudut bangunan—mulai dari pilihan material kayu, tekstur dinding semen halus, hingga penataan pencahayaan alami—agar mampu menyatu dengan iklim sejuk Soreang.
                </p>
              </div>
            </div>

            <div className="mt-16 editorial-img-wrapper h-[450px] sm:h-[600px] w-full">
              <Image
                src="/images/kopimage_space_morning.png"
                alt="Suasana KOPIMAGE Soreang"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </section>

        <section className="py-24 editorial-border-b bg-[#14110F]">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 border-t border-[#F3EFEA]/10 pt-6">
                <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#C29B7F] block mb-2">
                  03 / WHAT WE BELIEVE
                </span>
                <h2 className="font-serif text-3xl text-[#F3EFEA]">
                  Prinsip Utama KOPIMAGE
                </h2>
              </div>
              <div className="lg:col-span-8 border-t border-[#F3EFEA]/10 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="p-6 border border-[#F3EFEA]/10 bg-[#0C0A09]">
                    <span className="font-serif text-2xl text-[#C29B7F] block mb-2">Kejujuran Bahan</span>
                    <p className="font-sans text-xs text-[#9E9287] leading-relaxed">
                      Kami memilih biji kopi pilihan dan bahan dapur tanpa kompromi pada kualitas cita rasa.
                    </p>
                  </div>
                  <div className="p-6 border border-[#F3EFEA]/10 bg-[#0C0A09]">
                    <span className="font-serif text-2xl text-[#C29B7F] block mb-2">Penghargaan Waktu</span>
                    <p className="font-sans text-xs text-[#9E9287] leading-relaxed">
                      Waktumu di meja adalah milikmu sepenuhnya. Duduklah senyaman dan selama yang kamu butuhkan.
                    </p>
                  </div>
                  <div className="p-6 border border-[#F3EFEA]/10 bg-[#0C0A09]">
                    <span className="font-serif text-2xl text-[#C29B7F] block mb-2">Keramahan Hening</span>
                    <p className="font-sans text-xs text-[#9E9287] leading-relaxed">
                      Pelayanan yang sigap dan ramah tanpa mengganggu kenyamanan dan privasimu.
                    </p>
                  </div>
                  <div className="p-6 border border-[#F3EFEA]/10 bg-[#0C0A09]">
                    <span className="font-serif text-2xl text-[#C29B7F] block mb-2">Keberlanjutan Komunitas</span>
                    <p className="font-sans text-xs text-[#9E9287] leading-relaxed">
                      Mendukung produsen lokal dan membangun ekosistem kreatif di kawasan Soreang.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 border-b border-[#F3EFEA]/10">
          <div className="editorial-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <div className="editorial-img-wrapper h-[450px] sm:h-[550px]">
                  <Image
                    src="/images/kopimage_barista_pouring_1786480929425.png"
                    alt="Tim Barista KOPIMAGE"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              <div className="lg:col-span-6 lg:pl-8">
                <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#C29B7F] block mb-2">
                  04 / THE PEOPLE BEHIND IT
                </span>
                <h2 className="font-serif text-4xl sm:text-5xl font-light mb-6">
                  Manusia di Balik KOPIMAGE
                </h2>
                <p className="font-sans text-sm text-[#9E9287] font-light leading-relaxed mb-6">
                  Tim kami terdiri dari para peracik kopi, koki dapur, dan pengelola ruang yang disatukan oleh passion terhadap hospitality. Setiap anggota tim dilatih untuk memahami keunikan tiap sajian dan melayani dengan kehangatan tulus.
                </p>
                <Link href="/visit" className="editorial-btn">
                  <span>TEMUI KAMI DI SOREANG</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
