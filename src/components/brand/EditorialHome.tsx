'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MENU_ITEMS } from '../../data/menuData';
import {
    ArrowRight,
    ArrowUpRight,
    MapPin,
    Clock,
    Star,
    Navigation,
    Car,
    Wifi,
    Music,
    Coffee,
    Sparkles,
    Users,
    UtensilsCrossed,
    Search,
    ChevronDown,
    ChevronUp,
    QrCode
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import AnimatedList from './AnimatedList';
import MenuDetailModal from './MenuDetailModal';
import { MenuItem } from '../../types/menu';

// Dynamic import for WebGL CircularGallery component with explicit .default unwrapping
const CircularGallery = dynamic(() => import('./CircularGallery').then(mod => mod.default), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] flex items-center justify-center border border-[#FFFFFF]/10 bg-[#161210]">
            <div className="flex items-center gap-3 text-[#A89F91] text-xs uppercase tracking-widest font-sans">
                <span className="w-2 h-2 rounded-full bg-[#B82E2E] animate-ping" />
                <span>Memuat Galeri Momen 3D...</span>
            </div>
        </div>
    ),
});

export function EditorialHome() {
    const [activeOutlet, setActiveOutlet] = useState<'gading' | 'lanud'>('gading');
    const [activeMenuCategory, setActiveMenuCategory] = useState<string>('all');
    const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);

    // Automatic Multi-Variant Scroll Reveal Observer
    useEffect(() => {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

        const revealElements = document.querySelectorAll(
            '.reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-scale-pop, .reveal-blur-focus, .reveal-step-card'
        );

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        revealElements.forEach(el => observer.observe(el));

        return () => {
            revealElements.forEach(el => observer.unobserve(el));
        };
    }, []);

    // Moments for React Bits CircularGallery — 7 authentic moments with custom captions
    const galleryMoments = [
        { image: '/images/Moments-Live music.png', text: 'Live music' },
        { image: '/images/Moments-Bukber bareng ayang bikin HAPPY.png', text: 'Bukber bareng ayang bikin HAPPY' },
        { image: '/images/Moments-Bukber bareng teman-teman lebih asyikkk.png', text: 'Bukber bareng teman-teman lebih asyikkk' },
        { image: '/images/Moments-Weekend perfect with coffe in hand.png', text: 'Weekend perfect with coffe in hand' },
        { image: '/images/Moments-Dine in atau takeaway tetap sama rasanya.png', text: 'Dine in atau takeaway tetap sama rasanya' },
        { image: '/images/Moments-Meet the team behind your favorite cup.png', text: 'Meet the team behind your favorite cup' },
        { image: '/images/Moments-Top coffe.png', text: 'Top coffe' },
    ];

    // Row 1 ratings - animating left
    const ratingsRow1 = [
        {
            name: 'Rian Hidayat',
            role: 'Pengunjung Setia',
            rating: '5.0',
            comment: 'Tempat ngopi paling asik di Soreang. Pas ada live music akustiknya bikin betah nongkrong sampai malam.',
            date: 'Kemarin'
        },
        {
            name: 'Siti Sarah',
            role: 'Pengunjung Soreang',
            rating: '5.0',
            comment: 'Pesan dari meja pakai QR gampang banget. Nggak usah ngantre di kasir, tinggal duduk kopi langsung sampai.',
            date: '2 hari lalu'
        },
        {
            name: 'Aditya Pratama',
            role: 'Warga Gading Tutuka',
            rating: '5.0',
            comment: 'Es Kopi Susu Signature-nya pas di lidah, rasanya konstan. Teras luar ruangannya sejuk banget pas sore.',
            date: '3 hari lalu'
        },
        {
            name: 'Elena Rostova',
            role: 'Kopi Enthusiast',
            rating: '5.0',
            comment: 'Suasananya ramah buat nugas atau ngobrol santai. Dua cabangnya sama-sama nyaman.',
            date: '1 minggu lalu'
        }
    ];

    // Row 2 ratings - animating right
    const ratingsRow2 = [
        {
            name: 'Daffa Nugraha',
            role: 'Freelancer',
            rating: '5.0',
            comment: 'Colokan banyak, WiFi kencang, dan baristanya ramah-ramah. Cabang Lanud Sulaiman tempat nugas favorit saya.',
            date: '4 hari lalu'
        },
        {
            name: 'Maya Indah',
            role: 'Pengunjung Lanud Sulaiman',
            rating: '5.0',
            comment: 'Cemilan dan mie-nya enak-enak. Pas malam minggu ada live music seru banget bareng teman-teman.',
            date: '5 hari lalu'
        },
        {
            name: 'Budi Santoso',
            role: 'Warga Bandung',
            rating: '5.0',
            comment: 'Area parkirnya luas baik di Gading Tutuka maupun Lanud. Pilihan kopi manual brew-nya komplit.',
            date: '1 minggu lalu'
        },
        {
            name: 'Farah Amalia',
            role: 'Pengunjung Soreang',
            rating: '5.0',
            comment: 'Bukan cuma soal tempat foto, kopi dan makanan di Kopi Mage beneran enak dan ramah kantong.',
            date: '2 minggu lalu'
        }
    ];

    const menuCategories = [
        { id: 'all', name: 'SEMUA MENU' },
        { id: 'coffee', name: 'KOPI RACIKAN' },
        { id: 'non-coffee', name: 'NON-COFFEE & TEA' },
        { id: 'main-course', name: 'MAKANAN & MIE' },
        { id: 'cemilan', name: 'CEMILAN' },
    ];

    const displayedMenuItems = MENU_ITEMS.filter(item => {
        // Strict filter: ONLY show menu items with uploaded photos
        if (!item.image) return false;

        if (activeMenuCategory === 'all') return true;
        if (activeMenuCategory === 'coffee') return item.category === 'coffee' || item.category === 'seasonal';
        if (activeMenuCategory === 'non-coffee') return item.category === 'non-coffee';
        if (activeMenuCategory === 'main-course') return item.category === 'main-course';
        if (activeMenuCategory === 'cemilan') return item.category === 'cemilan-asin' || item.category === 'cemilan-manis';
        return true;
    });

    return (
        <div className="bg-[#0E0B0A] text-[#FFFFFF] min-h-screen selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
            {/* ----------------------------------------------------
          1. HERO SECTION (#home) — INDUSTRIAL COKLAT & DARK MATTE
         ---------------------------------------------------- */}
            <section id="home" className="relative pt-6 pb-12 lg:pb-16 editorial-border-b bg-[#0E0B0A]">
                <div className="editorial-container">
                    {/* Sub-header Bar (Operating Hours & Live Music Info) */}
                    <div className="flex flex-wrap items-center justify-between border-b border-[#FFFFFF]/10 pb-4 mb-8 gap-3 reveal-fade-up is-visible">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#B82E2E] animate-pulse" />
                            <span className="font-sans text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-[#B82E2E] font-semibold">
                                LIVE MUSIC WEEKEND • 2 CABANG: GADING TUTUKA & LANUD SULAIMAN
                            </span>
                        </div>
                        <span className="font-sans text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-[#C29B7F] font-medium">
                            BUKA SETIAP HARI • 07.00 - 23.00 WIB
                        </span>
                    </div>

                    {/* Clean 2-Column Content Area */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">

                        {/* LEFT COLUMN: Title + Description + Side-by-Side Action Buttons */}
                        <div className="md:col-span-7 lg:col-span-6 reveal-fade-up is-visible" style={{ transitionDelay: '0.1s' }}>

                            {/* Main Headline Text */}
                            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF] leading-[1.12] mb-5">
                                Kedai Kopi Berkonsep Industrial di Soreang & Margahayu
                            </h1>

                            {/* Description Paragraph */}
                            <p className="font-sans text-sm sm:text-base text-[#A89F91] leading-relaxed font-light mb-8 max-w-xl">
                                Tempat santai untuk ngopi, nugas, dan kumpul bersama teman atau pasangan. Menyediakan pilihan kopi racikan barista, makanan hangat, dan suasana teras sejuk di 2 cabang resmi (Gading Tutuka & Lanud Sulaiman).
                            </p>

                            {/* Two Side-by-Side Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                <a
                                    href="#menu"
                                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#B82E2E] text-[#FFFFFF] hover:bg-[#D63434] transition-colors text-xs tracking-wider uppercase font-semibold border border-[#B82E2E] shadow-sm text-center w-full sm:w-auto"
                                >
                                    <span>Menu Best Seller</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="#experience"
                                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#FFFFFF]/30 bg-transparent text-[#FFFFFF] hover:border-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-colors text-xs tracking-wider uppercase font-semibold text-center w-full sm:w-auto"
                                >
                                    <Coffee className="w-4 h-4 text-[#C29B7F]" />
                                    <span>Cara Pesan</span>
                                </a>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Prominent Welcome.png Coffee Image */}
                        <div className="md:col-span-5 lg:col-span-6 reveal-scale-pop is-visible flex justify-center lg:justify-end" style={{ transitionDelay: '0.2s' }}>
                            <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-[#B82E2E]/30 shadow-xl bg-[#161210] mx-auto lg:ml-auto">
                                <Image
                                    src="/images/Welcome.png"
                                    alt="Kopi Mage Espresso Crema & Roasted Coffee Beans"
                                    fill
                                    priority
                                    className="object-cover object-center"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          2. ABOUT KOPI MAGE (#about) — INDUSTRIAL PAPER SURFACE
         ---------------------------------------------------- */}
            <section id="about" className="py-16 lg:py-24 editorial-border-b bg-[#161210]">
                <div className="editorial-container">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 reveal-slide-left">
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                02 / TENTANG KOPI MAGE
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl leading-tight font-light mb-6 text-[#FFFFFF]">
                                Tempat pas buat cerita dan ngopi santai.
                            </h2>
                            <p className="font-sans text-sm sm:text-base text-[#A89F91] leading-relaxed mb-6 font-light">
                                Kopi Mage hadir dengan konsep <strong className="text-[#C29B7F] font-normal">Industrial Design</strong> yang hangat untuk memberikan ruang nongkrong ramah buat siapa saja. Mau ngopi pagi sebelum aktivitas, nugas siang hari, atau nongkrong malam mingguan sambil dengerin musik.
                            </p>
                            <p className="font-sans text-sm sm:text-base text-[#A89F91] leading-relaxed mb-8 font-light">
                                Kini Kopi Mage makin dekat dengan Anda melalui <strong className="text-[#FFFFFF] font-semibold">2 cabang utama</strong>: cabang Gading Tutuka (Soreang) dan cabang Lanud Sulaiman (Margahayu).
                            </p>
                            <div className="p-6 border border-[#B82E2E]/30 bg-[#0E0B0A] max-w-md rounded-xl">
                                <span className="font-serif italic text-lg text-[#C29B7F] block mb-2 font-medium">
                                    "Kopi Nikmat, Tempat Hangat, Live Music Asik."
                                </span>
                                <p className="font-sans text-xs text-[#A89F91]">
                                    Pengalaman nongkrong jujur tanpa batasan di Kopi Mage.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] reveal-scale-pop border border-[#FFFFFF]/10 rounded-2xl">
                                <Image
                                    src="/images/kopimage_space_morning.png"
                                    alt="Suasana Pagi Kopi Mage"
                                    fill
                                    loading="eager"
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                            <div className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] sm:mt-12 reveal-scale-pop border border-[#FFFFFF]/10 rounded-2xl" style={{ transitionDelay: '0.2s' }}>
                                <Image
                                    src="/images/WFC.png"
                                    alt="Suasana Malam Kopi Mage Lanud Sulaiman"
                                    fill
                                    loading="eager"
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          2.3. KATALOG MENU BEST SELLER (#menu) — DROPDOWN COLLAPSIBLE SHOWCASE
         ---------------------------------------------------- */}
            <section id="menu" className="py-12 lg:py-16 editorial-border-b bg-[#0E0B0A] transition-all">
                <div className="editorial-container">
                    {/* Collapsible Header Block */}
                    <div className="p-5 sm:p-8 border border-[#B82E2E]/30 bg-[#161210] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg reveal-fade-up">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/40 flex items-center justify-center shrink-0">
                                <Coffee className="w-6 h-6 text-[#B82E2E]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-sans text-[0.68rem] tracking-[0.22em] uppercase text-[#B82E2E] font-semibold">
                                        MENU BEST SELLER KOPI MAGE
                                    </span>
                                    <span className="px-2 py-0.5 bg-[#B82E2E]/20 text-[#C29B7F] text-[0.62rem] font-sans tracking-wider uppercase font-semibold rounded-md border border-[#B82E2E]/30">
                                        FAVORIT PENGUNJUNG
                                    </span>
                                </div>
                                <h2 className="font-serif text-2xl sm:text-3xl font-light text-[#FFFFFF]">
                                    Pilihan Menu Best Seller
                                </h2>
                                <p className="font-sans text-xs text-[#A89F91] font-light mt-1 max-w-2xl leading-relaxed">
                                    {isMenuExpanded
                                        ? 'Menampilkan menu Best Seller pilihan Kopi Mage. Untuk melihat seluruh varian menu lengkap & memesan, silakan scan Barcode QR di meja saat berkunjung.'
                                        : 'Klik "LIHAT MENU BEST SELLER" untuk melihat daftar menu favorit Kopi Mage.'}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Expand / Collapse Dropdown Button */}
                        <button
                            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#B82E2E] text-[#FFFFFF] hover:bg-[#D63434] transition-all text-xs tracking-wider uppercase font-semibold border border-[#B82E2E] shadow-sm shrink-0 group cursor-pointer w-full sm:w-auto"
                        >
                            <span>{isMenuExpanded ? 'TUTUP KATALOG BEST SELLER' : 'LIHAT MENU BEST SELLER'}</span>
                            {isMenuExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#FFFFFF] transition-transform" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-[#FFFFFF] group-hover:translate-y-0.5 transition-transform" />
                            )}
                        </button>
                    </div>

                    {/* Dropdown Expandable Body with Smooth Open/Close Animation */}
                    <AnimatePresence>
                        {isMenuExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                            >
                                <div className="mt-8 pt-8 border-t border-[#FFFFFF]/10">
                                    {/* Category Filter Pills (Read-Only) */}
                                    <div className="flex flex-wrap gap-2.5 mb-8 overflow-x-auto pb-2">
                                        {menuCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveMenuCategory(cat.id)}
                                                className={`px-5 py-2.5 rounded-full font-sans text-xs tracking-wider uppercase transition-all whitespace-nowrap ${activeMenuCategory === cat.id
                                                    ? 'bg-[#B82E2E] text-[#FFFFFF] font-semibold shadow-sm'
                                                    : 'bg-[#161210] text-[#A89F91] hover:text-[#FFFFFF] border border-[#FFFFFF]/10 hover:border-[#B82E2E]/40'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Menu Items Showcase Grid with React Bits AnimatedList */}
                                    <AnimatedList
                                        items={displayedMenuItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedDetailItem(item)}
                                                className="p-5 border border-[#FFFFFF]/10 bg-[#161210] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#B82E2E]/40 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {item.image && (
                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#0E0B0A] border border-[#FFFFFF]/05 shrink-0">
                                                            <Image
                                                                src={item.image}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                                sizes="80px"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-[#B82E2E] text-[#FFFFFF] text-[0.6rem] font-sans tracking-wider uppercase font-semibold rounded-md shadow-sm">
                                                                BEST SELLER
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-[#FFFFFF]/05 text-[#C29B7F] text-[0.6rem] font-sans tracking-wider uppercase font-medium rounded-md border border-[#FFFFFF]/10">
                                                                KLIK UNTUK DETAIL ↗
                                                            </span>
                                                        </div>
                                                        <h3 className="font-serif text-lg font-normal text-[#FFFFFF] group-hover:text-[#C29B7F] transition-colors">
                                                            {item.name}
                                                        </h3>
                                                        <p className="font-sans text-xs text-[#A89F91] font-light leading-relaxed max-w-lg">
                                                            {item.description || 'Racikan khas berkualitas disajikan hangat di Kopi Mage.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 sm:pt-0 sm:border-l sm:border-[#FFFFFF]/08 sm:pl-6 flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                                                    <span className="font-sans text-[0.65rem] tracking-wider uppercase text-[#9E9287]">HARGA</span>
                                                    <span className="font-serif text-xl font-medium text-[#C29B7F]">
                                                        {item.price.includes('K') || item.price.includes('Rp') ? item.price : `Rp ${item.price}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        onItemSelect={(item, index) => setSelectedDetailItem(displayedMenuItems[index])}
                                        showGradients={true}
                                        enableArrowNavigation={true}
                                        displayScrollbar={false}
                                        className="w-full mb-8"
                                    />

                                    {/* Informational QR Barcode Banner */}
                                    <div className="p-5 sm:p-6 border border-[#B82E2E]/30 bg-[#161210] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#B82E2E]/15 border border-[#B82E2E]/30 flex items-center justify-center shrink-0">
                                                <QrCode className="w-6 h-6 text-[#B82E2E]" />
                                            </div>
                                            <div>
                                                <h4 className="font-serif text-lg text-[#FFFFFF] font-normal">Ingin Melihat Seluruh Menu Lengkap Kopi Mage?</h4>
                                                <p className="font-sans text-xs text-[#A89F91] font-light leading-relaxed mt-0.5">
                                                    Untuk melihat seluruh pilihan menu lengkap (kopi, non-kopi, makanan berat & cemilan) serta melakukan pemesanan langsung dari meja, Anda dapat **scan Kode QR / Barcode yang terpasang di setiap meja** saat berkunjung di cabang Gading Tutuka atau Lanud Sulaiman.
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href="#experience"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B82E2E] text-[#FFFFFF] text-xs font-sans tracking-wider uppercase font-semibold hover:bg-[#D63434] transition-colors shrink-0 w-full sm:w-auto text-center justify-center"
                                        >
                                            <span>SIMULASI SCAN QR MEJA</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* Bottom Close Button Bar */}
                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={() => setIsMenuExpanded(false)}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#FFFFFF]/20 bg-[#161210] text-[#A89F91] hover:text-[#FFFFFF] hover:border-[#B82E2E] transition-all text-xs font-sans tracking-wider uppercase font-medium cursor-pointer"
                                        >
                                            <span>TUTUP KATALOG BEST SELLER</span>
                                            <ChevronUp className="w-4 h-4 text-[#B82E2E]" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* ----------------------------------------------------
          2.5. LIVE MUSIC & EVENT HIGHLIGHT (#livemusic)
         ---------------------------------------------------- */}
            <section id="livemusic" className="py-16 lg:py-24 editorial-border-b bg-[#0E0B0A]">
                <div className="editorial-container">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        <div className="lg:col-span-6 reveal-slide-left">
                            <div className="relative h-[280px] sm:h-[400px] lg:h-[480px] w-full editorial-img-wrapper border border-[#B82E2E]/30 rounded-2xl overflow-hidden shadow-lg">
                                <Image
                                    src="/images/Moments-Live music.png"
                                    alt="Live Music Acoustic Session di Kopi Mage"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute top-4 left-4 bg-[#0E0B0A]/90 backdrop-blur-md px-3 sm:px-4 py-2 border border-[#B82E2E]/40 rounded-lg flex items-center gap-2 shadow-sm">
                                    <Music className="w-4 h-4 text-[#B82E2E] animate-pulse" />
                                    <span className="font-sans text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#FFFFFF] font-semibold">
                                        LIVE MUSIC EVERY WEEKEND
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 lg:pl-6 reveal-slide-right">
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                03 / LIVE MUSIC & EVENT
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-tight mb-6 text-[#FFFFFF]">
                                Malam mingguan lebih seru dengan Live Music.
                            </h2>
                            <p className="font-sans text-sm sm:text-base text-[#A89F91] font-light leading-relaxed mb-6">
                                Setiap akhir pekan, Kopi Mage menghadirkan sesion musik akustik dari talenta lokal. Nikmati alunan lagu favorit sambil menikmati cangkir kopi pilihan dan cemilan favorit Anda.
                            </p>
                            <div className="space-y-4 font-sans text-xs text-[#A89F91] font-light">
                                <div className="p-4 border border-[#FFFFFF]/10 bg-[#161210] rounded-xl flex items-center gap-4 shadow-sm">
                                    <Music className="w-5 h-5 text-[#B82E2E] shrink-0" />
                                    <div>
                                        <span className="font-semibold text-[#FFFFFF] block text-sm">Akustik & Pop Santai</span>
                                        <span>Lagu-lagu pilihan yang bikin suasana makin hangat tanpa bikin bising.</span>
                                    </div>
                                </div>
                                <div className="p-4 border border-[#FFFFFF]/10 bg-[#161210] rounded-xl flex items-center gap-4 shadow-sm">
                                    <Users className="w-5 h-5 text-[#C29B7F] shrink-0" />
                                    <div>
                                        <span className="font-semibold text-[#FFFFFF] block text-sm">Terbuka Untuk Siapa Saja</span>
                                        <span>Ajak teman, keluarga, atau pasangan untuk menikmati malam bersama di Kopi Mage.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          2.8. CIRCULAR GALLERY 3D (MOMEN SERU COPY)
         ---------------------------------------------------- */}
            <section id="moments" className="py-16 lg:py-24 editorial-border-b bg-[#161210]">
                <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                    <div className="flex flex-col text-left border-b border-[#FFFFFF]/10 pb-6 max-w-2xl">
                        <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#C29B7F] font-semibold block mb-2">
                            GALERI & MOMEN SERU
                        </span>
                        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF] mb-3">
                            Momen-Momen Seru di KOPIMAGE
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed">
                            Geser atau putar galeri 3D di bawah ini untuk melihat momen seru nongkrong, live music, bukber, dan kehangatan bersama teman & pasangan di Kopi Mage.
                        </p>
                    </div>
                </div>

                {/* WebGL Circular Canvas Gallery with responsive height wrapper */}
                <div className="reveal-blur-focus relative w-full h-[480px] sm:h-[560px] md:h-[640px]">
                    <CircularGallery
                        bend={0}
                        textColor="#FFFFFF"
                        borderRadius={0.05}
                        scrollEase={0.12}
                        scrollSpeed={2.5}
                        fontUrl="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&display=swap"
                        font="bold 26px Plus Jakarta Sans"
                        items={galleryMoments}
                    />
                </div>
            </section>

            {/* ----------------------------------------------------
          3. THE SPACE (#space) - INDUSTRIAL SPACE
         ---------------------------------------------------- */}
            <section id="space" className="py-16 lg:py-24 editorial-border-b bg-[#0E0B0A]">
                <div className="editorial-container">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 pb-6 border-b border-[#FFFFFF]/10 reveal-fade-up">
                        <div>
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-2">
                                04 / AREA NONGKRONG
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF]">
                                Fasilitas & Ruang
                            </h2>
                        </div>
                        <p className="font-sans text-xs sm:text-sm text-[#A89F91] max-w-md font-light mt-4 md:mt-0">
                            Desain berkonsep industrial kayu & besi raw agar Anda betah berlama-lama, baik untuk diskusi maupun nugas.
                        </p>
                    </div>

                    <div className="editorial-img-wrapper h-[35vh] sm:h-[55vh] lg:h-[75vh] w-full mb-8 sm:mb-12 reveal-blur-focus border border-[#FFFFFF]/10 rounded-2xl">
                        <Image
                            src="/images/kopimage_space_terrace_1786480961312.png"
                            alt="Teras Kopi Mage Industrial Design"
                            fill
                            className="object-cover"
                            sizes="100vw"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-6">
                        <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210] rounded-xl shadow-sm reveal-step-card">
                            <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">Teras Luas</span>
                            <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                Pilihan meja indoor ber-AC dan area teras outdoor industrial yang sejuk dengan pencahayaan alami.
                            </p>
                        </div>
                        <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.15s' }}>
                            <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">Stopkontak & WiFi</span>
                            <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                Colokan listrik melimpah di setiap area dan jaringan internet cepat untuk nugas atau kerja remote.
                            </p>
                        </div>
                        <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.3s' }}>
                            <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">Parkir Luas</span>
                            <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                Lahan parkir aman dan lega untuk kendaraan roda dua maupun roda empat di kedua cabang.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          4. THE EXPERIENCE (#experience) - PESAN QR MEJA
         ---------------------------------------------------- */}
            <section id="experience" className="py-16 lg:py-24 editorial-border-b bg-[#161210]">
                <div className="editorial-container">
                    <div className="max-w-2xl mb-12 sm:mb-16 reveal-slide-left">
                        <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                            05 / LAYANAN MEJA
                        </span>
                        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light mb-4 text-[#FFFFFF]">
                            Pesan Dari Meja Tanpa Antre
                        </h2>
                        <p className="font-sans text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed">
                            Langsung duduk di meja favorit Anda, scan kode QR yang terpasang, dan pilih pesanan Anda secara praktis dari ponsel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card">
                            <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">01</span>
                            <div>
                                <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">DUDUK</h3>
                                <p className="font-sans text-xs text-[#A89F91] font-light">
                                    Pilih tempat duduk di indoor maupun teras outdoor.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.15s' }}>
                            <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">02</span>
                            <div>
                                <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">SCAN QR</h3>
                                <p className="font-sans text-xs text-[#A89F91] font-light">
                                    Buka kamera ponsel dan scan stiker QR yang ada di meja.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.3s' }}>
                            <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">03</span>
                            <div>
                                <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">PILIH MENU</h3>
                                <p className="font-sans text-xs text-[#A89F91] font-light">
                                    Pilih kopi, minuman, cemilan, atau makanan utama favorit.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.45s' }}>
                            <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">04</span>
                            <div>
                                <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">NIKMATI</h3>
                                <p className="font-sans text-xs text-[#A89F91] font-light">
                                    Pesanan diantarkan hangat langsung ke meja Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          5. DUAL-ROW UNLIMITED MOVING RATINGS MARQUEE (#ratings)
         ---------------------------------------------------- */}
            <section className="py-16 lg:py-24 editorial-border-b overflow-hidden bg-[#0E0B0A] marquee-container">
                <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#FFFFFF]/10 pb-6">
                        <div>
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-2">
                                06 / KATA PENGUNJUNG
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF]">
                                Ulasan & Rating Pengunjung
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                            <div className="flex text-[#B82E2E]">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-[#B82E2E]" />
                                ))}
                            </div>
                            <span className="font-sans text-sm text-[#FFFFFF] font-semibold ml-1">4.9 / 5.0</span>
                            <span className="font-sans text-xs text-[#A89F91] font-light">(Google Reviews)</span>
                        </div>
                    </div>
                </div>

                {/* ROW 1: ANIMATING LEFT (UNLIMITED LOOP) */}
                <div className="w-full overflow-hidden mb-6 reveal-blur-focus">
                    <div className="animate-marquee-left flex gap-4 sm:gap-6 px-4">
                        {[...ratingsRow1, ...ratingsRow1, ...ratingsRow1, ...ratingsRow1].map((item, idx) => (
                            <div
                                key={`row1-${idx}`}
                                className="w-[280px] sm:w-[360px] md:w-[400px] shrink-0 p-5 sm:p-6 border border-[#FFFFFF]/10 bg-[#161210] rounded-2xl shadow-sm hover:shadow-md hover:border-[#B82E2E]/60 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex text-[#B82E2E]">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 fill-[#B82E2E]" />
                                            ))}
                                        </div>
                                        <span className="font-sans text-[0.65rem] text-[#A89F91] uppercase tracking-wider font-medium">
                                            {item.date}
                                        </span>
                                    </div>
                                    <p className="font-serif italic text-sm sm:text-base text-[#FFFFFF] leading-relaxed mb-6 font-light">
                                        "{item.comment}"
                                    </p>
                                </div>
                                <div className="border-t border-[#FFFFFF]/10 pt-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-sans text-xs font-semibold text-[#FFFFFF]">{item.name}</h4>
                                        <span className="font-sans text-[0.7rem] text-[#A89F91]">{item.role}</span>
                                    </div>
                                    <span className="font-sans text-[0.65rem] tracking-widest text-[#B82E2E] uppercase font-semibold">
                                        ULASAN VERIFIKASI
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ROW 2: ANIMATING RIGHT (UNLIMITED LOOP OPPOSITE DIRECTION) */}
                <div className="w-full overflow-hidden reveal-blur-focus" style={{ transitionDelay: '0.2s' }}>
                    <div className="animate-marquee-right flex gap-4 sm:gap-6 px-4">
                        {[...ratingsRow2, ...ratingsRow2, ...ratingsRow2, ...ratingsRow2].map((item, idx) => (
                            <div
                                key={`row2-${idx}`}
                                className="w-[280px] sm:w-[360px] md:w-[400px] shrink-0 p-5 sm:p-6 border border-[#FFFFFF]/10 bg-[#161210] rounded-2xl shadow-sm hover:shadow-md hover:border-[#B82E2E]/60 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex text-[#B82E2E]">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 fill-[#B82E2E]" />
                                            ))}
                                        </div>
                                        <span className="font-sans text-[0.65rem] text-[#A89F91] uppercase tracking-wider font-medium">
                                            {item.date}
                                        </span>
                                    </div>
                                    <p className="font-serif italic text-sm sm:text-base text-[#FFFFFF] leading-relaxed mb-6 font-light">
                                        "{item.comment}"
                                    </p>
                                </div>
                                <div className="border-t border-[#FFFFFF]/10 pt-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-sans text-xs font-semibold text-[#FFFFFF]">{item.name}</h4>
                                        <span className="font-sans text-[0.7rem] text-[#A89F91]">{item.role}</span>
                                    </div>
                                    <span className="font-sans text-[0.65rem] tracking-widest text-[#B82E2E] uppercase font-semibold">
                                        ULASAN VERIFIKASI
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          6. BARISTA & RACIKAN KOPI (#barista)
         ---------------------------------------------------- */}
            <section className="py-16 lg:py-24 editorial-border-b bg-[#161210]">
                <div className="editorial-container">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        <div className="lg:col-span-6 order-2 lg:order-1 reveal-slide-left">
                            <div className="editorial-img-wrapper h-[300px] sm:h-[450px] lg:h-[600px] border border-[#FFFFFF]/10 rounded-2xl overflow-hidden shadow-md">
                                <Image
                                    src="/images/kopimage_barista_pouring_1786480929425.png"
                                    alt="Barista Kopi Mage menyeduh kopi manual brew"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-6 order-1 lg:order-2 lg:pl-8 reveal-slide-right">
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                07 / RACIKAN KOPI
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-tight mb-6 text-[#FFFFFF]">
                                Racikan kopi pilihan dari barista berpengalaman.
                            </h2>
                            <p className="font-sans text-sm sm:text-base text-[#A89F91] font-light leading-relaxed mb-6">
                                Setiap minuman diseduh dengan takaran yang pas. Mulai dari Es Kopi Susu Signature yang gurih manis seimbang, hingga pilihan biji kopi single origin manual brew.
                            </p>
                            <blockquote className="border-l-2 border-[#B82E2E] pl-6 py-2 my-6 font-serif italic text-lg sm:text-xl text-[#C29B7F] font-medium">
                                "Racikan nikmat, bahan berkualitas, disajikan hangat untuk menemani obrolan Anda."
                            </blockquote>
                        </div>
                    </div>
                </div>
            </section>

            {/* ----------------------------------------------------
          7. 2 OUTLETS LIVE LOCATION MAPS TRACKER (#visit)
         ---------------------------------------------------- */}
            <section id="visit" className="py-16 lg:py-24 bg-[#0E0B0A] editorial-border-b">
                <div className="editorial-container">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#FFFFFF]/10 reveal-fade-up">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#B82E2E] animate-pulse" />
                                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold">
                                    08 / LOKASI 2 CABANG KOPI MAGE
                                </span>
                            </div>
                            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF]">
                                Kunjungi Cabang Terdekat
                            </h2>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-wrap gap-4 text-xs font-sans text-[#A89F91]">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#B82E2E]" />
                                <span>Buka Setiap Hari • 07.00 - 23.00 WIB</span>
                            </div>
                        </div>
                    </div>

                    {/* Outlet Tab Selector Buttons */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 reveal-fade-up">
                        <button
                            onClick={() => setActiveOutlet('gading')}
                            className={`py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-colors border rounded-xl ${activeOutlet === 'gading'
                                ? 'bg-[#B82E2E] text-[#FFFFFF] border-[#B82E2E] font-semibold shadow-sm'
                                : 'bg-[#161210] text-[#FFFFFF] border-[#FFFFFF]/15 hover:border-[#B82E2E]'
                                }`}
                        >
                            1. Cabang Gading Tutuka (Soreang)
                        </button>
                        <button
                            onClick={() => setActiveOutlet('lanud')}
                            className={`py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-colors border rounded-xl ${activeOutlet === 'lanud'
                                ? 'bg-[#B82E2E] text-[#FFFFFF] border-[#B82E2E] font-semibold shadow-sm'
                                : 'bg-[#161210] text-[#FFFFFF] border-[#FFFFFF]/15 hover:border-[#B82E2E]'
                                }`}
                        >
                            2. Cabang Lanud Sulaiman (Margahayu)
                        </button>
                    </div>

                    {/* Interactive Live Radar Map Frame */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Live Map Tracker Embed Frame */}
                        <div className="lg:col-span-8 relative border border-[#FFFFFF]/15 overflow-hidden min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] bg-[#161210] rounded-2xl reveal-scale-pop shadow-sm">
                            <div className="absolute top-4 left-4 z-20 bg-[#0E0B0A]/90 backdrop-blur-md px-3 sm:px-4 py-2 border border-[#B82E2E]/40 rounded-lg flex items-center gap-2 sm:gap-3 shadow-sm">
                                <Navigation className="w-4 h-4 text-[#B82E2E] animate-bounce" />
                                <span className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#FFFFFF] font-semibold">
                                    {activeOutlet === 'gading' ? 'RADAR MAP • GADING TUTUKA SOREANG' : 'RADAR MAP • LANUD SULAIMAN MARGAHAYU'}
                                </span>
                            </div>

                            <iframe
                                title={activeOutlet === 'gading' ? 'Kopi Mage Gading Tutuka Google Maps' : 'Kopi Mage Lanud Sulaiman Google Maps'}
                                src={
                                    activeOutlet === 'gading'
                                        ? 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15840.48529342732!2d107.5255!3d-7.0264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68ec63fa7ab701%3A0x6b77ad9d6756858e!2sGading%20Tutuka%2C%20Soreang%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
                                        : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15841.442958744031!2d107.5681!3d-6.9803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e92c0a969b8d%3A0x44618e47f259779!2sLanud%20Sulaiman%2C%20Margahayu%2C%20Bandung%20Regency%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
                                }
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: '300px' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="dark-map-filter"
                            />
                        </div>

                        {/* Practical Tracker Sidebar */}
                        <div className="lg:col-span-4 p-5 sm:p-8 border border-[#FFFFFF]/15 bg-[#161210] rounded-2xl shadow-sm flex flex-col justify-between space-y-6 reveal-slide-right">
                            <div>
                                <span className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                    {activeOutlet === 'gading' ? 'INFORMASI CABANG GADING TUTUKA' : 'INFORMASI CABANG LANUD SULAIMAN'}
                                </span>

                                <div className="space-y-3 font-sans text-xs text-[#A89F91] font-light mb-6">
                                    <div className="p-3.5 border border-[#FFFFFF]/10 bg-[#0E0B0A] rounded-xl">
                                        <span className="font-semibold text-[#FFFFFF] block mb-1">Alamat Cabang</span>
                                        <span>
                                            {activeOutlet === 'gading'
                                                ? 'Jl. Gading Tutuka No. 88, Soreang, Kab. Bandung (Dekat Tol Seroja)'
                                                : 'Kawasan Lanud Sulaiman, Margahayu, Kab. Bandung'}
                                        </span>
                                    </div>
                                    <div className="p-3.5 border border-[#FFFFFF]/10 bg-[#0E0B0A] rounded-xl">
                                        <span className="font-semibold text-[#FFFFFF] block mb-1">Jam Operasional</span>
                                        <span>Buka Setiap Hari: 07.00 - 23.00 WIB</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[#FFFFFF]/10">
                                    <div className="flex items-center gap-3 text-xs text-[#A89F91]">
                                        <Music className="w-4 h-4 text-[#B82E2E] shrink-0" />
                                        <span>Live Music Akustik Setiap Weekend</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[#A89F91]">
                                        <Car className="w-4 h-4 text-[#B82E2E] shrink-0" />
                                        <span>Area Parkir Luas (Mobil & Motor)</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[#A89F91]">
                                        <Wifi className="w-4 h-4 text-[#B82E2E] shrink-0" />
                                        <span>Koneksi WiFi Cepat & Banyak Colokan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Direct Google Maps Action Buttons */}
                            <div className="pt-4 border-t border-[#FFFFFF]/10 mt-auto space-y-3">
                                <a
                                    href={
                                        activeOutlet === 'gading'
                                            ? 'https://maps.app.goo.gl/UMQuf74XVjg3FVWL9'
                                            : 'https://maps.app.goo.gl/4d7zB7HYjwocxUwaA'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full block text-center py-4 px-4 text-xs tracking-[0.18em] uppercase font-semibold bg-[#B82E2E] text-[#FFFFFF] hover:bg-[#D63434] transition-colors border border-[#B82E2E] rounded-xl shadow-sm relative z-10"
                                >
                                    <span className="inline-flex items-center justify-center gap-2">
                                        <span>
                                            {activeOutlet === 'gading'
                                                ? 'BUKA MAPS GADING TUTUKA'
                                                : 'BUKA MAPS LANUD SULAIMAN'}
                                        </span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Menu Detail Pop-up Modal */}
            <MenuDetailModal item={selectedDetailItem} onClose={() => setSelectedDetailItem(null)} />
        </div>
    );
}
