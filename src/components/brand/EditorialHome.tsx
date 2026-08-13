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
    const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

    // Fetch Live Menu Items from /api/menu for table QR & main landing page
    useEffect(() => {
        fetch('/api/menu')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.menu) && data.menu.length > 0) {
                    setLiveMenuItems(data.menu);
                }
            })
            .catch((err) => console.error('Failed to fetch live menu in EditorialHome:', err));
    }, []);

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
        { image: '/images/Moments-Live music.webp', text: 'Live music' },
        { image: '/images/Moments-Bukber bareng ayang bikin HAPPY.webp', text: 'Bukber bareng ayang bikin HAPPY' },
        { image: '/images/Moments-Bukber bareng teman-teman lebih asyikkk.webp', text: 'Bukber bareng teman-teman lebih asyikkk' },
        { image: '/images/Moments-Weekend perfect with coffe in hand.webp', text: 'Weekend perfect with coffe in hand' },
        { image: '/images/Moments-Dine in atau takeaway tetap sama rasanya.webp', text: 'Dine in atau takeaway tetap sama rasanya' },
        { image: '/images/Moments-Meet the team behind your favorite cup.webp', text: 'Meet the team behind your favorite cup' },
        { image: '/images/Moments-Top coffe.webp', text: 'Top coffe' },
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

    // Filter ONLY Best Seller items for the landing page showcase and prioritize items with images
    const bestSellerSource = (liveMenuItems && liveMenuItems.length > 0 ? liveMenuItems : MENU_ITEMS)
        .filter(item => item.isBestSeller)
        .sort((a, b) => {
            if (a.image && !b.image) return -1;
            if (!a.image && b.image) return 1;
            return 0;
        });

    const displayedMenuItems = bestSellerSource.filter(item => {
        if (activeMenuCategory === 'all') return true;
        if (activeMenuCategory === 'coffee') return item.category === 'coffee' || item.category === 'seasonal';
        if (activeMenuCategory === 'non-coffee') return item.category === 'non-coffee';
        if (activeMenuCategory === 'main-course') return item.category === 'main-course';
        if (activeMenuCategory === 'cemilan') return item.category === 'cemilan-asin' || item.category === 'cemilan-manis';
        return true;
    }); return (
        <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease, color 0.25s ease' }} className="min-h-screen w-full overflow-x-hidden selection:bg-[#B82E2E] selection:text-[#FFFFFF] pb-8">
            {/* ----------------------------------------------------
          1. HERO SECTION (#home) — INDUSTRIAL COKLAT & DARK MATTE
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 pb-2 max-w-[1440px] mx-auto">
                <section id="home" style={{ background: '#9E1F1F' }} className="relative pt-6 pb-12 lg:pb-16 rounded-2xl sm:rounded-3xl border border-white/15 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        {/* Sub-header Bar (Operating Hours & Live Music Info) */}
                        <div className="flex flex-wrap items-center justify-between border-b border-[#FFFFFF]/10 pb-4 mb-8 gap-3 reveal-fade-up is-visible">
                            <div className="flex items-center gap-2.5">

                                <span style={{ color: '#FFE600' }} className="font-sans text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] sm:tracking-[0.22em] uppercase font-bold">
                                    LIVE MUSIC WEEKEND • 2 CABANG: GADING TUTUKA & LANUD SULAIMAN
                                </span>
                            </div>
                            <span style={{ color: '#FFFFFF' }} className="font-sans text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] sm:tracking-[0.22em] uppercase font-medium">
                                BUKA SETIAP HARI • 07.00 - 23.00 WIB
                            </span>
                        </div>

                        {/* Clean 2-Column Content Area */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">

                            {/* HERO IMAGE: Order 1 on mobile (Appears ON TOP of title), Order 2 on desktop */}
                            <div className="order-1 md:order-2 md:col-span-5 lg:col-span-6 reveal-scale-pop is-visible flex justify-center lg:justify-end" style={{ transitionDelay: '0.1s' }}>
                                <div className="relative w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-[#B82E2E]/30 shadow-xl bg-[#161210] mx-auto lg:ml-auto">
                                    <Image
                                        src="/images/Welcome.webp"
                                        alt="Kopi Mage Espresso Crema & Roasted Coffee Beans"
                                        fill
                                        priority
                                        className="object-cover object-center"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            </div>

                            {/* HERO TEXT CONTENT: Order 2 on mobile (Appears BELOW image), Order 1 on desktop */}
                            <div className="order-2 md:order-1 md:col-span-7 lg:col-span-6 reveal-fade-up is-visible" style={{ transitionDelay: '0.2s' }}>

                                {/* Main Headline Text */}
                                <h1 style={{ color: '#FFFFFF' }} className="font-serif text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.15] mb-4 sm:mb-5">
                                    Kedai Kopi Berkonsep Industrial di Soreang & Margahayu
                                </h1>

                                {/* Description Paragraph */}
                                <p style={{ color: '#FFFFFF' }} className="font-sans text-xs sm:text-base leading-relaxed font-light mb-6 sm:mb-8 max-w-xl">
                                    Tempat asik buat ngopi santai, nugas, atau nongkrong bareng temen & ayang. Nikmatin racikan kopi barista, cemilan garing, sampe makanan berat di 2 cabang resmi Kopi Mage (Gading Tutuka & Lanud Sulaiman).
                                </p>

                                {/* Two Side-by-Side Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <a
                                        href="#menu"
                                        style={{ background: '#FFFFFF', color: '#8C1C1C', borderColor: '#FFFFFF', fontWeight: 700 }}
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl transition-all text-xs tracking-wider uppercase border shadow-md text-center w-full sm:w-auto cursor-pointer"
                                    >
                                        <span>Menu Best Seller</span>
                                        <ArrowRight className="w-4 h-4" style={{ color: '#8C1C1C' }} />
                                    </a>
                                    <a
                                        href="#experience"
                                        style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)', fontWeight: 600 }}
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border transition-all text-xs tracking-wider uppercase text-center w-full sm:w-auto cursor-pointer"
                                    >
                                        <Coffee className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                                        <span>Cara Pesan</span>
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </div>
            <br /><br /><br />
            {/* ----------------------------------------------------
          2. ABOUT KOPI MAGE (#about) — INDUSTRIAL PAPER SURFACE
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="about" className="py-16 lg:py-24 bg-[#161210] border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start mb-12 sm:mb-16">
                            <div className="lg:col-span-5 reveal-slide-left">
                                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                    02 / TENTANG KOPI MAGE
                                </span>
                                <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl leading-tight font-light mb-6 text-[#FFFFFF]">
                                    Tempat pas buat cerita dan ngopi santai.
                                </h2>
                                <p className="font-sans text-sm sm:text-base text-[#A89F91] leading-relaxed mb-6 font-light">
                                    Kopi Mage hadir dengan konsep <strong className="text-[#C29B7F] font-normal">Industrial Design</strong> yang hangat dan ramah buat siapa aja. Mau ngopi pagi sebelum aktivitas, nugas siang hari, atau nongkrong malam mingguan sambil dengerin musik.
                                </p>
                                <p className="font-sans text-sm sm:text-base text-[#A89F91] leading-relaxed mb-8 font-light">
                                    Kini Kopi Mage makin deket sama kamu di <strong className="text-[#FFFFFF] font-semibold">2 cabang utama</strong>: cabang Gading Tutuka (Soreang) dan cabang Lanud Sulaiman (Margahayu).
                                </p>
                                <div style={{ background: '#7A1414', borderColor: 'rgba(255,255,255,0.3)' }} className="p-6 border max-w-md rounded shadow-lg">
                                    <span style={{ color: '#FFE600' }} className="font-serif italic text-lg block mb-2 font-bold">
                                        "Kopi Enak, Suasana Nyaman, Live Music Asik."
                                    </span>
                                    <p style={{ color: '#FFFFFF' }} className="font-sans text-xs font-light">
                                        Tempat nongkrong jujur buat nikmatin setiap harimu di Kopi Mage.
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] reveal-scale-pop border border-[#FFFFFF]/10 ">
                                    <Image
                                        src="/images/kopimage_space_morning.webp"
                                        alt="Suasana Pagi Kopi Mage"
                                        fill
                                        loading="eager"
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                                <div className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] sm:mt-12 reveal-scale-pop border border-[#FFFFFF]/10 " style={{ transitionDelay: '0.2s' }}>
                                    <Image
                                        src="/images/WFC.webp"
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
            </div>

            {/* ----------------------------------------------------
          2.3. KATALOG MENU BEST SELLER (#menu) — DROPDOWN COLLAPSIBLE SHOWCASE
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="menu" className="py-12 lg:py-16 bg-[#0E0B0A] rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden transition-all">
                    <div className="editorial-container">
                        {/* Collapsible Header Block */}
                        <div className="p-5 sm:p-8 border border-[#B82E2E]/30 bg-[#161210] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg reveal-fade-up">
                            <div className="flex items-start sm:items-center gap-4">
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
                                            ? 'Deretan menu Best Seller favorit di Kopi Mage. Mau liat menu lengkap & langsung pesen? Tinggal scan QR di meja pas kamu mampir ya!'
                                            : 'Klik "LIHAT MENU BEST SELLER" buat ngintip menu-menu favorit yang paling sering dipesen!'}
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
                                                    <h4 className="font-serif text-lg text-[#FFFFFF] font-normal">Mau Liat Semua Menu & Langsung Pesen?</h4>
                                                    <p className="font-sans text-xs text-[#A89F91] font-light leading-relaxed mt-0.5">
                                                        Pas kamu mampir ke cabang Gading Tutuka atau Lanud Sulaiman, tinggal duduk santai di meja terus **scan stiker QR di mejanya**. Semua pilihan kopi, non-kopi, makanan, & cemilan bisa langsung kamu pesen dari HP tanpa antre!
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
            </div>

            {/* ----------------------------------------------------
          2.5. LIVE MUSIC & EVENT HIGHLIGHT (#livemusic)
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="livemusic" className="py-16 lg:py-24 bg-[#0E0B0A]  border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-6 reveal-slide-left">
                                <div className="relative h-[280px] sm:h-[400px] lg:h-[480px] w-full editorial-img-wrapper border border-[#B82E2E]/30 overflow-hidden shadow-lg">
                                    <Image
                                        src="/images/Moments-Live music.webp"
                                        alt="Live Music Acoustic Session di Kopi Mage"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                    <div className="absolute top-4 left-4 bg-[#0E0B0A]/90 backdrop-blur-md px-3 sm:px-4 py-2 border border-[#B82E2E]/40  flex items-center gap-2 shadow-sm">
                                        <Music className="w-4 h-4 text-[#B82E2E] animate-pulse" />
                                        <span className="font-sans text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase text-[#FFFFFF] font-semibold">
                                            LIVE MUSIC EVERY WEEKEND
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-6 reveal-slide-right">
                                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                    03 / LIVE MUSIC & EVENT
                                </span>
                                <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-tight mb-6 text-[#FFFFFF]">
                                    Malam mingguan makin seru bareng Live Music.
                                </h2>
                                <p className="font-sans text-sm sm:text-base text-[#A89F91] font-light leading-relaxed mb-6">
                                    Tiap akhir pekan, Kopi Mage ngadain sesi live music akustik dari talenta lokal. Nikmatin alunan lagu favorit sambil nyeruput cangkir kopi pilihan dan cemilan kesukaanmu.
                                </p>
                                <div className="space-y-4 font-sans text-xs text-[#A89F91] font-light">
                                    <div className="p-4 border border-[#FFFFFF]/10 bg-[#161210] flex items-center gap-4 shadow-sm">
                                        <Music className="w-5 h-5 text-[#B82E2E] shrink-0" />
                                        <div>
                                            <span className="font-semibold text-[#FFFFFF] block text-sm">Akustik & Pop Santai</span>
                                            <span>Playlist asik yang bikin suasana makin hidup dan tetep enak buat ngobrol.</span>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-[#FFFFFF]/10 bg-[#161210]  flex items-center gap-4 shadow-sm">
                                        <Users className="w-5 h-5 text-[#C29B7F] shrink-0" />
                                        <div>
                                            <span className="font-semibold text-[#FFFFFF] block text-sm">Bebas Ajak Siapa Aja</span>
                                            <span>Ajak temen satu circle, keluarga, atau pasangan buat nikmatin malam bareng di Kopi Mage.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ----------------------------------------------------
          2.8. CIRCULAR GALLERY 3D (MOMEN SERU COPY)
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="moments" style={{ background: '#0E0B0A' }} className="py-16 lg:py-24  border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                        <div className="flex flex-col text-left border-b border-[#FFFFFF]/10 pb-6 max-w-2xl">
                            <span style={{ color: '#FFE600' }} className="font-sans text-[0.7rem] tracking-[0.25em] uppercase font-bold block mb-2">
                                GALERI & MOMEN SERU
                            </span>
                            <h2 style={{ color: '#FFFFFF' }} className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light mb-3">
                                Momen-Momen Seru di KOPIMAGE
                            </h2>
                            <p style={{ color: '#FFFFFF' }} className="font-sans text-xs sm:text-sm font-light leading-relaxed">
                                Geser atau putar kartu 3D di bawah ini buat ngintip keseruan nongkrong, live music, bukber, dan kehangatan bareng temen & pasangan di Kopi Mage.
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
            </div>

            {/* ----------------------------------------------------
          3. THE SPACE (#space) - INDUSTRIAL SPACE
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="space" className="py-16 lg:py-24 bg-[#0E0B0A] border border-white/10 shadow-xl overflow-hidden">
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
                                Konsep industrial kayu & besi raw yang adem bikin kamu betah berlama-lama, mau buat nugas, WFC, atau ngobrol santai.
                            </p>
                        </div>

                        <div className="editorial-img-wrapper h-[35vh] sm:h-[55vh] lg:h-[75vh] w-full mb-8 sm:mb-12 reveal-blur-focus border border-[#FFFFFF]/10 ">
                            <Image
                                src="/images/kopimage_space_terrace_1786480961312.webp"
                                alt="Teras Kopi Mage Industrial Design"
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-6">
                            <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210]  shadow-sm reveal-step-card">
                                <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">Teras & Indoor Lega</span>
                                <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                    Bebas pilih meja indoor ber-AC yang nyaman atau area teras outdoor sejuk buat nongkrong santai.
                                </p>
                            </div>
                            <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210]  shadow-sm reveal-step-card" style={{ transitionDelay: '0.15s' }}>
                                <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">WiFi Kenceng & Colokan</span>
                                <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                    Colokan listrik melimpah di setiap area dan koneksi WiFi stabil buat nugas atau kerja remote seharian.
                                </p>
                            </div>
                            <div className="p-5 sm:p-6 border border-[#B82E2E]/25 bg-[#161210]  shadow-sm reveal-step-card" style={{ transitionDelay: '0.3s' }}>
                                <span className="font-serif text-xl sm:text-2xl text-[#C29B7F] block mb-2 font-medium">Parkir Luas & Aman</span>
                                <p className="font-sans text-xs text-[#A89F91] leading-relaxed">
                                    Lahan parkir lega dan aman buat kendaraan motor maupun mobil di cabang Gading Tutuka & Lanud Sulaiman.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ----------------------------------------------------
          4. THE EXPERIENCE (#experience) - PESAN QR MEJA
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="experience" className="py-16 lg:py-24 bg-[#161210] rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        <div className="max-w-2xl mb-12 sm:mb-16 reveal-slide-left">
                            <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                05 / LAYANAN MEJA
                            </span>
                            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light mb-4 text-[#FFFFFF]">
                                Pesan Dari Meja Tanpa Perlu Antre
                            </h2>
                            <p className="font-sans text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed">
                                Tinggal cari meja favoritmu, scan stiker QR di meja lewat HP, terus pilih menu kesukaanmu secara praktis.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card">
                                <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">01</span>
                                <div>
                                    <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">DUDUK</h3>
                                    <p className="font-sans text-xs text-[#A89F91] font-light">
                                        Pilih spot duduk favoritmu di indoor maupun teras outdoor.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.15s' }}>
                                <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">02</span>
                                <div>
                                    <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">SCAN QR</h3>
                                    <p className="font-sans text-xs text-[#A89F91] font-light">
                                        Buka kamera HP terus scan stiker QR yang terpasang di mejamu.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.3s' }}>
                                <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">03</span>
                                <div>
                                    <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">PILIH MENU</h3>
                                    <p className="font-sans text-xs text-[#A89F91] font-light">
                                        Pilih kopi racikan, minuman segar, cemilan, atau makanan utama.
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 sm:p-8 border border-[#FFFFFF]/10 relative flex flex-col justify-between h-56 sm:h-64 bg-[#0E0B0A] rounded-xl shadow-sm reveal-step-card" style={{ transitionDelay: '0.45s' }}>
                                <span className="font-serif text-3xl sm:text-4xl text-[#B82E2E] font-light">04</span>
                                <div>
                                    <h3 className="font-serif text-xl sm:text-2xl text-[#FFFFFF] mb-2 font-medium">NIKMATI</h3>
                                    <p className="font-sans text-xs text-[#A89F91] font-light">
                                        Tinggal santai, pesananmu bakal langsung dianterin hangat ke meja.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ----------------------------------------------------
          5. DUAL-ROW UNLIMITED MOVING RATINGS MARQUEE (#ratings)
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section className="py-16 lg:py-24 bg-[#0E0B0A] border border-white/10 shadow-xl overflow-hidden marquee-container">
                    <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#FFFFFF]/10 pb-6">
                            <div>
                                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-2">
                                    06 / KATA PENGUNJUNG
                                </span>
                                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light text-[#FFFFFF]">
                                    Kata Mereka Tentang Kopi Mage
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
                                            ULASAN TERVERIFIKASI
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
                                    className="w-[280px] sm:w-[360px] md:w-[400px] shrink-0 p-5 sm:p-6 border border-[#FFFFFF]/10 bg-[#161210] shadow-sm hover:shadow-md hover:border-[#B82E2E]/60 transition-all flex flex-col justify-between"
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
                                            ULASAN TERVERIFIKASI
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* ----------------------------------------------------
          6. BARISTA & RACIKAN KOPI (#barista)
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="barista" className="py-16 lg:py-24 bg-[#161210] border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-6 order-2 lg:order-1 reveal-slide-left">
                                <div className="editorial-img-wrapper h-[300px] sm:h-[450px] lg:h-[600px] border border-[#FFFFFF]/10  overflow-hidden shadow-md">
                                    <Image
                                        src="/images/kopimage_barista_pouring_1786480929425.webp"
                                        alt="Barista Kopi Mage menyeduh kopi manual brew"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-6 order-1 lg:order-2 reveal-slide-right">
                                <span className="font-sans text-[0.7rem] tracking-[0.25em] uppercase text-[#B82E2E] font-semibold block mb-4">
                                    07 / RACIKAN KOPI
                                </span>
                                <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-light leading-tight mb-6 text-[#FFFFFF]">
                                    Racikan kopi pilihan dari barista berpengalaman.
                                </h2>
                                <p className="font-sans text-sm sm:text-base text-[#A89F91] font-light leading-relaxed mb-6">
                                    Tiap cangkir diseduh presisi oleh barista kami. Dari Es Kopi Susu Signature yang legit creamy seimbang, sampe aneka manual brew single origin buat kamu pecinta kopi sejati.
                                </p>
                                <blockquote className="border-l-2 border-[#B82E2E] pl-6 py-2 my-6 font-serif italic text-lg sm:text-xl text-[#C29B7F] font-medium">
                                    "Kopi enak, racikan jujur, disajiin hangat buat nemenin setiap obrolan serumu."
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ----------------------------------------------------
          7. 2 OUTLETS LIVE LOCATION MAPS TRACKER (#visit)
         ---------------------------------------------------- */}
            <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[1440px] mx-auto">
                <section id="visit" className="py-16 lg:py-24 bg-[#0E0B0A] rounded-2xl sm:rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                    <div className="editorial-container">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#FFFFFF]/10 reveal-fade-up">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
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
                                style={activeOutlet === 'gading'
                                    ? { background: '#FFFFFF', color: '#8C1C1C', borderColor: '#FFFFFF', fontWeight: 'bold' }
                                    : { background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }
                                }
                                className="py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-all border rounded-xl shadow-sm cursor-pointer"
                            >
                                1. Cabang Gading Tutuka (Soreang)
                            </button>
                            <button
                                onClick={() => setActiveOutlet('lanud')}
                                style={activeOutlet === 'lanud'
                                    ? { background: '#FFFFFF', color: '#8C1C1C', borderColor: '#FFFFFF', fontWeight: 'bold' }
                                    : { background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }
                                }
                                className="py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-all border rounded-xl shadow-sm cursor-pointer"
                            >
                                2. Cabang Lanud Sulaiman (Margahayu)
                            </button>
                        </div>

                        {/* Interactive Live Radar Map Frame */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            {/* Live Map Tracker Embed Frame */}
                            <div className="lg:col-span-8 relative border border-[#FFFFFF]/15 overflow-hidden min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] bg-[#161210] rounded-2xl reveal-scale-pop shadow-sm">
                                <iframe
                                    title={activeOutlet === 'gading' ? 'KOPIMAGE Cabang Soreang Google Maps' : 'Kopi Mage Lanud Sulaiman Google Maps'}
                                    src={
                                        activeOutlet === 'gading'
                                            ? 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.0!2d107.5421997!3d-7.0229314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68edc76611300b%3A0x3209179d92898707!2sKOPIMAGE!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid'
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

                                    <div className="space-y-3 font-sans text-xs font-light mb-6">
                                        <div style={{ background: '#ffffffff', borderColor: 'rgba(255, 0, 0, 1)' }} className="p-3.5 border rounded-xl shadow-sm">
                                            <span style={{ color: '#ffffffff' }} className="font-bold block mb-1">Alamat Cabang</span>
                                            <span style={{ color: '#FFFFFF' }}>
                                                {activeOutlet === 'gading'
                                                    ? 'Jl. Gading Tutuka No. 88, Soreang, Kab. Bandung (Dekat Tol Seroja)'
                                                    : 'Kawasan Lanud Sulaiman, Margahayu, Kab. Bandung'}
                                            </span>
                                        </div>
                                        <div style={{ background: '#ffffffff', borderColor: 'rgba(255, 0, 0, 1)' }} className="p-3.5 border rounded-xl shadow-sm">
                                            <span style={{ color: '#ffffffff' }} className="font-bold block mb-1">Jam Operasional</span>
                                            <span style={{ color: '#FFFFFF' }}>Buka Setiap Hari: 07.00 - 23.00 WIB</span>
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
                                                ? 'https://maps.app.goo.gl/SS6748EDgyeR2Jgh9'
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
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Menu Detail Pop-up Modal */}
            <MenuDetailModal item={selectedDetailItem} onClose={() => setSelectedDetailItem(null)} />
        </div>
    );
}

export default EditorialHome;
