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
import { useTheme } from '@/context/ThemeContext';

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
    const { theme } = useTheme();
    const isDark = theme === 'dark';
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
                                        quality={85}
                                        className="object-cover object-center"
                                        sizes="(max-width: 640px) 280px, (max-width: 1024px) 420px, 480px"
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
                <section
                    id="about"
                    style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start mb-12 sm:mb-16">
                            <div className="lg:col-span-5 reveal-slide-left">
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-4"
                                >
                                    02 / TENTANG KOPI MAGE
                                </span>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl md:text-6xl leading-tight font-bold mb-6"
                                >
                                    Ruang teduh untuk jeda, percakapan, dan seduhan jujur.
                                </h2>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-sm sm:text-base leading-relaxed mb-6 font-light"
                                >
                                    KOPIMAGE hadir menghadirkan ruang bernapas di tengah dinamika Soreang dan Margahayu. Mengusung arsitektur <strong style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="font-semibold">Industrial Design</strong> yang hangat, kami menyatukan kopi pilihan, hidangan lezat, dan keramahan tulus dalam satu harmoni.
                                </p>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-sm sm:text-base leading-relaxed mb-8 font-light"
                                >
                                    Kini melayani Anda di <strong style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }} className="font-semibold">2 cabang utama</strong>: Cabang Gading Tutuka (Soreang) dan Cabang Lanud Sulaiman (Margahayu).
                                </p>
                                <div style={{ background: '#7A1414', borderColor: 'rgba(255,255,255,0.3)' }} className="p-6 border max-w-md rounded-xl shadow-lg quote-highlight-card">
                                    <span style={{ color: '#FFE600' }} className="font-serif italic text-lg block mb-2 font-bold quote-title">
                                        "Kopi Enak, Suasana Nyaman, Live Music Asik."
                                    </span>
                                    <p style={{ color: '#FFFFFF' }} className="font-sans text-xs font-light quote-desc">
                                        Dedikasi rasa dan kenyamanan untuk menyempurnakan setiap momen kunjungan Anda di Kopi Mage.
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div
                                    style={{
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                    }}
                                    className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] reveal-scale-pop border rounded-2xl overflow-hidden shadow-md"
                                >
                                    <Image
                                        src="/images/kopimage_space_morning.webp"
                                        alt="Suasana Pagi Kopi Mage"
                                        fill
                                        loading="lazy"
                                        quality={80}
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                                    />
                                </div>
                                <div
                                    style={{
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                        transitionDelay: '0.2s'
                                    }}
                                    className="editorial-img-wrapper h-[260px] sm:h-[360px] md:h-[400px] sm:mt-12 reveal-scale-pop border rounded-2xl overflow-hidden shadow-md"
                                >
                                    <Image
                                        src="/images/WFC.webp"
                                        alt="Suasana Malam Kopi Mage Lanud Sulaiman"
                                        fill
                                        loading="lazy"
                                        quality={80}
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
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
                <section
                    id="menu"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-12 lg:py-16 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden transition-all"
                >
                    <div className="editorial-container">
                        {/* Collapsible Header Block */}
                        <div
                            style={{
                                background: isDark ? '#161210' : '#FAF7F5',
                                borderColor: isDark ? 'rgba(184, 46, 46, 0.3)' : '#9E1F1F',
                            }}
                            className="p-5 sm:p-8 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md reveal-fade-up"
                        >
                            <div className="flex items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                            className="font-sans text-[0.68rem] tracking-[0.22em] uppercase font-bold"
                                        >
                                            MENU BEST SELLER KOPI MAGE
                                        </span>
                                        <span
                                            style={{
                                                background: isDark ? 'rgba(184, 46, 46, 0.2)' : '#F5EBEB',
                                                borderColor: isDark ? 'rgba(184, 46, 46, 0.3)' : '#9E1F1F',
                                                color: isDark ? '#D4A373' : '#9E1F1F',
                                            }}
                                            className="px-2 py-0.5 text-[0.62rem] font-sans tracking-wider uppercase font-bold rounded-md border"
                                        >
                                            FAVORIT PENGUNJUNG
                                        </span>
                                    </div>
                                    <h2
                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                        className="font-serif text-2xl sm:text-3xl font-bold"
                                    >
                                        Pilihan Racikan &amp; Hidangan Terbaik
                                    </h2>
                                    <p
                                        style={{ color: isDark ? '#A89F91' : '#444444' }}
                                        className="font-sans text-xs font-light mt-1 max-w-2xl leading-relaxed"
                                    >
                                        {isMenuExpanded
                                            ? 'Koleksi sajian kopi pilihan, minuman segar, dan hidangan signature KOPIMAGE. Silakan jelajahi pilihan favorit dan nikmati kemudahan pemesanan langsung dari meja Anda.'
                                            : 'Buka katalog untuk menjelajahi sajian racikan kopi dan hidangan signature terfavorit.'}
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Expand / Collapse Dropdown Button */}
                            <button
                                onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                                style={{ background: '#9E1F1F', color: '#FFFFFF', borderColor: '#9E1F1F' }}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl hover:opacity-90 transition-all text-xs tracking-wider uppercase font-bold border shadow-md shrink-0 group cursor-pointer w-full sm:w-auto"
                            >
                                <span>{isMenuExpanded ? 'TUTUP KATALOG' : 'JELAJAHI MENU BEST SELLER'}</span>
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
                                    <div
                                        style={{
                                            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                        }}
                                        className="mt-8 pt-8 border-t"
                                    >
                                        {/* Category Filter Pills (Read-Only) */}
                                        <div className="flex flex-wrap gap-2.5 mb-8 overflow-x-auto pb-2">
                                            {menuCategories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveMenuCategory(cat.id)}
                                                    style={activeMenuCategory === cat.id
                                                        ? { background: '#9E1F1F', color: '#FFFFFF', borderColor: '#9E1F1F', fontWeight: 'bold' }
                                                        : { background: isDark ? '#161210' : '#FAF7F5', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F', color: isDark ? '#A89F91' : '#1A1A1A' }
                                                    }
                                                    className="px-5 py-2.5 rounded-full font-sans text-xs tracking-wider uppercase transition-all whitespace-nowrap border cursor-pointer shadow-sm"
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
                                                    style={{
                                                        background: isDark ? '#161210' : '#FAF7F5',
                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                                    }}
                                                    className="p-5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#9E1F1F] transition-all group cursor-pointer shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {item.image && (
                                                            <div
                                                                style={{
                                                                    background: isDark ? '#0E0B0A' : '#FFFFFF',
                                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                                                }}
                                                                className="relative w-20 h-20 rounded-xl overflow-hidden border shrink-0"
                                                            >
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    fill
                                                                    loading="lazy"
                                                                    quality={75}
                                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    sizes="80px"
                                                                />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-0.5 bg-[#9E1F1F] text-[#FFFFFF] text-[0.6rem] font-sans tracking-wider uppercase font-bold rounded-md shadow-sm">
                                                                    BEST SELLER
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        color: isDark ? '#D4A373' : '#9E1F1F',
                                                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.3)',
                                                                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    }}
                                                                    className="px-2 py-0.5 text-[0.6rem] font-sans tracking-wider uppercase font-bold rounded-md border"
                                                                >
                                                                    KLIK UNTUK DETAIL ↗
                                                                </span>
                                                            </div>
                                                            <h3
                                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                                className="font-serif text-lg font-bold group-hover:text-[#9E1F1F] transition-colors"
                                                            >
                                                                {item.name}
                                                            </h3>
                                                            <p
                                                                style={{ color: isDark ? '#A89F91' : '#555555' }}
                                                                className="font-sans text-xs font-light leading-relaxed max-w-lg"
                                                            >
                                                                {item.description || 'Racikan khas berkualitas disajikan hangat di Kopi Mage.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                                        }}
                                                        className="pt-2 sm:pt-0 sm:border-l sm:pl-6 flex sm:flex-col items-center sm:items-end justify-between shrink-0"
                                                    >
                                                        <span
                                                            style={{ color: isDark ? '#A89F91' : '#777777' }}
                                                            className="font-sans text-[0.65rem] tracking-wider uppercase font-bold"
                                                        >
                                                            HARGA
                                                        </span>
                                                        <span
                                                            style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                                            className="font-serif text-xl font-bold"
                                                        >
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
                                        <div
                                            style={{
                                                background: isDark ? '#161210' : '#FAF7F5',
                                                borderColor: isDark ? 'rgba(184, 46, 46, 0.3)' : '#9E1F1F',
                                            }}
                                            className="p-5 sm:p-6 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    style={{
                                                        background: isDark ? 'rgba(184, 46, 46, 0.15)' : '#F5EBEB',
                                                        borderColor: isDark ? 'rgba(184, 46, 46, 0.3)' : '#9E1F1F',
                                                    }}
                                                    className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
                                                >
                                                    <QrCode className="w-6 h-6 text-[#9E1F1F]" />
                                                </div>
                                                <div>
                                                    <h4
                                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                        className="font-serif text-lg font-bold"
                                                    >
                                                        Pemesanan Langsung Dari Meja
                                                    </h4>
                                                    <p
                                                        style={{ color: isDark ? '#A89F91' : '#555555' }}
                                                        className="font-sans text-xs font-light leading-relaxed mt-0.5"
                                                    >
                                                        Saat berkunjung ke cabang Gading Tutuka atau Lanud Sulaiman, silakan duduk nyaman di meja Anda dan pindai stiker QR yang tersedia untuk melakukan pemesanan instan tanpa perlu mengantre.
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href="#experience"
                                                style={{ background: '#9E1F1F', color: '#FFFFFF' }}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-sans tracking-wider uppercase font-bold hover:opacity-90 transition-opacity shrink-0 w-full sm:w-auto text-center justify-center shadow-sm"
                                            >
                                                <span>PANDUAN PESAN MEJA</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>

                                        {/* Bottom Close Button Bar */}
                                        <div className="flex justify-center pt-2">
                                            <button
                                                onClick={() => setIsMenuExpanded(false)}
                                                style={{
                                                    background: isDark ? '#161210' : '#FAF7F5',
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#9E1F1F',
                                                    color: isDark ? '#A89F91' : '#1A1A1A',
                                                }}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border transition-all text-xs font-sans tracking-wider uppercase font-bold cursor-pointer shadow-sm"
                                            >
                                                <span>TUTUP KATALOG BEST SELLER</span>
                                                <ChevronUp className="w-4 h-4 text-[#9E1F1F]" />
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
                <section
                    id="livemusic"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-6 reveal-slide-left">
                                <div
                                    style={{
                                        borderColor: isDark ? 'rgba(184, 46, 46, 0.3)' : 'rgba(158, 31, 31, 0.25)',
                                    }}
                                    className="relative h-[280px] sm:h-[400px] lg:h-[480px] w-full editorial-img-wrapper border overflow-hidden rounded-2xl shadow-lg"
                                >
                                    <Image
                                        src="/images/Moments-Live music.webp"
                                        alt="Live Music Acoustic Session di Kopi Mage"
                                        fill
                                        loading="lazy"
                                        quality={80}
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                    <div
                                        style={{
                                            background: isDark ? 'rgba(14, 11, 10, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                                            borderColor: isDark ? 'rgba(184, 46, 46, 0.4)' : '#9E1F1F',
                                        }}
                                        className="absolute top-4 left-4 backdrop-blur-md px-3 sm:px-4 py-2 border rounded-xl flex items-center gap-2 shadow-md"
                                    >
                                        <Music className="w-4 h-4 text-[#9E1F1F] animate-pulse" />
                                        <span
                                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                            className="font-sans text-[0.62rem] sm:text-[0.65rem] tracking-[0.18em] sm:tracking-[0.2em] uppercase font-bold"
                                        >
                                            LIVE MUSIC EVERY WEEKEND
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-6 reveal-slide-right">
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-4"
                                >
                                    03 / LIVE MUSIC &amp; EVENT
                                </span>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
                                >
                                    Malam mingguan makin seru bareng Live Music.
                                </h2>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-sm sm:text-base font-light leading-relaxed mb-6"
                                >
                                    Tiap akhir pekan, Kopi Mage ngadain sesi live music akustik dari talenta lokal. Nikmatin alunan lagu favorit sambil nyeruput cangkir kopi pilihan dan cemilan kesukaanmu.
                                </p>
                                <div className="space-y-4 font-sans text-xs">
                                    <div
                                        style={{
                                            background: isDark ? '#161210' : '#FAF7F5',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                        }}
                                        className="p-4 border rounded-xl flex items-center gap-4 shadow-sm"
                                    >
                                        <Music className="w-5 h-5 text-[#9E1F1F] shrink-0" />
                                        <div>
                                            <span
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-bold block text-sm mb-0.5"
                                            >
                                                Akustik &amp; Pop Santai
                                            </span>
                                            <span style={{ color: isDark ? '#A89F91' : '#555555' }}>
                                                Playlist asik yang bikin suasana makin hidup dan tetep enak buat ngobrol.
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background: isDark ? '#161210' : '#FAF7F5',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                        }}
                                        className="p-4 border rounded-xl flex items-center gap-4 shadow-sm"
                                    >
                                        <Users className="w-5 h-5 text-[#9E1F1F] shrink-0" />
                                        <div>
                                            <span
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-bold block text-sm mb-0.5"
                                            >
                                                Bebas Ajak Siapa Aja
                                            </span>
                                            <span style={{ color: isDark ? '#A89F91' : '#555555' }}>
                                                Ajak temen satu circle, keluarga, atau pasangan buat nikmatin malam bareng di Kopi Mage.
                                            </span>
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
                <section
                    id="moments"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                        <div
                            style={{
                                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                            }}
                            className="flex flex-col text-left border-b pb-6 max-w-2xl"
                        >
                            <span
                                style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-2"
                            >
                                GALERI &amp; MOMEN SERU
                            </span>
                            <h2
                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold mb-3"
                            >
                                Momen-Momen Seru di KOPIMAGE
                            </h2>
                            <p
                                style={{ color: isDark ? '#A89F91' : '#444444' }}
                                className="font-sans text-xs sm:text-sm font-light leading-relaxed"
                            >
                                Geser atau putar kartu 3D di bawah ini buat ngintip keseruan nongkrong, live music, bukber, dan kehangatan bareng temen &amp; pasangan di Kopi Mage.
                            </p>
                        </div>
                    </div>

                    {/* WebGL Circular Canvas Gallery with responsive height wrapper */}
                    <div className="reveal-blur-focus relative w-full h-[480px] sm:h-[560px] md:h-[640px]">
                        <CircularGallery
                            bend={0}
                            textColor={isDark ? '#FFFFFF' : '#1A1A1A'}
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
                <section
                    id="space"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div
                            style={{
                                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                            }}
                            className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 pb-6 border-b reveal-fade-up"
                        >
                            <div>
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-2"
                                >
                                    04 / AREA NONGKRONG
                                </span>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold"
                                >
                                    Fasilitas &amp; Ruang
                                </h2>
                            </div>
                            <p
                                style={{ color: isDark ? '#A89F91' : '#444444' }}
                                className="font-sans text-xs sm:text-sm max-w-md font-light mt-4 md:mt-0"
                            >
                                Konsep industrial kayu &amp; besi raw yang adem bikin kamu betah berlama-lama, mau buat nugas, WFC, atau ngobrol santai.
                            </p>
                        </div>

                        <div
                            style={{
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                            }}
                            className="editorial-img-wrapper h-[35vh] sm:h-[55vh] lg:h-[75vh] w-full mb-8 sm:mb-12 reveal-blur-focus border rounded-2xl overflow-hidden shadow-md"
                        >
                            <Image
                                src="/images/kopimage_space_terrace_1786480961312.webp"
                                alt="Teras Kopi Mage Industrial Design"
                                fill
                                loading="lazy"
                                quality={80}
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 1440px"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-6">
                            <div
                                style={{
                                    background: isDark ? '#161210' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(184, 46, 46, 0.25)' : '#9E1F1F',
                                }}
                                className="p-5 sm:p-6 border rounded-2xl shadow-sm reveal-step-card"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-xl sm:text-2xl block mb-2 font-bold"
                                >
                                    Teras &amp; Indoor Lega
                                </span>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-xs leading-relaxed font-light"
                                >
                                    Bebas pilih meja indoor ber-AC yang nyaman atau area teras outdoor sejuk buat nongkrong santai.
                                </p>
                            </div>
                            <div
                                style={{
                                    background: isDark ? '#161210' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(184, 46, 46, 0.25)' : '#9E1F1F',
                                    transitionDelay: '0.15s'
                                }}
                                className="p-5 sm:p-6 border rounded-2xl shadow-sm reveal-step-card"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-xl sm:text-2xl block mb-2 font-bold"
                                >
                                    WiFi Kenceng &amp; Colokan
                                </span>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-xs leading-relaxed font-light"
                                >
                                    Colokan listrik melimpah di setiap area dan koneksi WiFi stabil buat nugas atau kerja remote seharian.
                                </p>
                            </div>
                            <div
                                style={{
                                    background: isDark ? '#161210' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(184, 46, 46, 0.25)' : '#9E1F1F',
                                    transitionDelay: '0.3s'
                                }}
                                className="p-5 sm:p-6 border rounded-2xl shadow-sm reveal-step-card"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-xl sm:text-2xl block mb-2 font-bold"
                                >
                                    Parkir Luas &amp; Aman
                                </span>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-xs leading-relaxed font-light"
                                >
                                    Lahan parkir lega dan aman buat kendaraan motor maupun mobil di cabang Gading Tutuka &amp; Lanud Sulaiman.
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
                <section
                    id="experience"
                    style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div className="max-w-2xl mb-12 sm:mb-16 reveal-slide-left">
                            <span
                                style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-4"
                            >
                                05 / LAYANAN MEJA
                            </span>
                            <h2
                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold mb-4"
                            >
                                Pesan Dari Meja Tanpa Perlu Antre
                            </h2>
                            <p
                                style={{ color: isDark ? '#A89F91' : '#444444' }}
                                className="font-sans text-xs sm:text-sm font-light leading-relaxed"
                            >
                                Tinggal cari meja favoritmu, scan stiker QR di meja lewat HP, terus pilih menu kesukaanmu secara praktis.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            <div
                                style={{
                                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                }}
                                className="p-6 sm:p-8 relative flex flex-col justify-between h-56 sm:h-64 rounded-2xl border shadow-sm reveal-step-card transition-colors"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-3xl sm:text-4xl font-bold"
                                >
                                    01
                                </span>
                                <div>
                                    <h3
                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                        className="font-serif text-xl sm:text-2xl mb-2 font-bold"
                                    >
                                        DUDUK
                                    </h3>
                                    <p
                                        style={{ color: isDark ? '#A89F91' : '#444444' }}
                                        className="font-sans text-xs font-light"
                                    >
                                        Silakan pilih area duduk favorit Anda di ruang indoor ber-AC maupun teras luar.
                                    </p>
                                </div>
                            </div>

                            <div
                                style={{
                                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                    transitionDelay: '0.15s'
                                }}
                                className="p-6 sm:p-8 relative flex flex-col justify-between h-56 sm:h-64 rounded-2xl border shadow-sm reveal-step-card transition-colors"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-3xl sm:text-4xl font-bold"
                                >
                                    02
                                </span>
                                <div>
                                    <h3
                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                        className="font-serif text-xl sm:text-2xl mb-2 font-bold"
                                    >
                                        SCAN QR
                                    </h3>
                                    <p
                                        style={{ color: isDark ? '#A89F91' : '#444444' }}
                                        className="font-sans text-xs font-light"
                                    >
                                        Buka kamera ponsel dan pindai stiker kode QR yang tertera pada meja Anda.
                                    </p>
                                </div>
                            </div>

                            <div
                                style={{
                                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                    transitionDelay: '0.3s'
                                }}
                                className="p-6 sm:p-8 relative flex flex-col justify-between h-56 sm:h-64 rounded-2xl border shadow-sm reveal-step-card transition-colors"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-3xl sm:text-4xl font-bold"
                                >
                                    03
                                </span>
                                <div>
                                    <h3
                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                        className="font-serif text-xl sm:text-2xl mb-2 font-bold"
                                    >
                                        PILIH MENU
                                    </h3>
                                    <p
                                        style={{ color: isDark ? '#A89F91' : '#444444' }}
                                        className="font-sans text-xs font-light"
                                    >
                                        Tentukan racikan kopi, minuman segar, cemilan, atau hidangan utama pilihan.
                                    </p>
                                </div>
                            </div>

                            <div
                                style={{
                                    background: isDark ? '#0E0B0A' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                    transitionDelay: '0.45s'
                                }}
                                className="p-6 sm:p-8 relative flex flex-col justify-between h-56 sm:h-64 rounded-2xl border shadow-sm reveal-step-card transition-colors"
                            >
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-serif text-3xl sm:text-4xl font-bold"
                                >
                                    04
                                </span>
                                <div>
                                    <h3
                                        style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                        className="font-serif text-xl sm:text-2xl mb-2 font-bold"
                                    >
                                        NIKMATI
                                    </h3>
                                    <p
                                        style={{ color: isDark ? '#A89F91' : '#444444' }}
                                        className="font-sans text-xs font-light"
                                    >
                                        Pesanan Anda segera diracik segar dan diantarkan langsung ke meja Anda.
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
                <section
                    id="ratings"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden marquee-container"
                >
                    <div className="editorial-container mb-8 sm:mb-12 reveal-fade-up">
                        <div
                            style={{
                                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                            }}
                            className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6"
                        >
                            <div>
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-2"
                                >
                                    06 / KATA PENGUNJUNG
                                </span>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold"
                                >
                                    Kata Mereka Tentang Kopi Mage
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                <div className="flex text-[#9E1F1F]">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-[#9E1F1F] text-[#9E1F1F]" />
                                    ))}
                                </div>
                                <span
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-sans text-sm font-bold ml-1"
                                >
                                    4.9 / 5.0
                                </span>
                                <span
                                    style={{ color: isDark ? '#A89F91' : '#666666' }}
                                    className="font-sans text-xs font-light"
                                >
                                    (Google Reviews)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ROW 1: ANIMATING LEFT (UNLIMITED LOOP) */}
                    <div className="w-full overflow-hidden mb-6 reveal-blur-focus">
                        <div className="animate-marquee-left flex gap-4 sm:gap-6 px-4">
                            {[...ratingsRow1, ...ratingsRow1, ...ratingsRow1, ...ratingsRow1].map((item, idx) => (
                                <div
                                    key={`row1-${idx}`}
                                    style={{
                                        background: isDark ? '#161210' : '#FAF7F5',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                    }}
                                    className="w-[280px] sm:w-[360px] md:w-[400px] shrink-0 p-5 sm:p-6 border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex text-[#9E1F1F]">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3.5 h-3.5 fill-[#9E1F1F] text-[#9E1F1F]" />
                                                ))}
                                            </div>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#777777' }}
                                                className="font-sans text-[0.65rem] uppercase tracking-wider font-semibold"
                                            >
                                                {item.date}
                                            </span>
                                        </div>
                                        <p
                                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                            className="font-serif italic text-sm sm:text-base leading-relaxed mb-6 font-medium"
                                        >
                                            "{item.comment}"
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                        }}
                                        className="border-t pt-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <h4
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-sans text-xs font-bold"
                                            >
                                                {item.name}
                                            </h4>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#666666' }}
                                                className="font-sans text-[0.7rem]"
                                            >
                                                {item.role}
                                            </span>
                                        </div>
                                        <span
                                            style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                            className="font-sans text-[0.65rem] tracking-widest uppercase font-bold"
                                        >
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
                                    style={{
                                        background: isDark ? '#161210' : '#FAF7F5',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                    }}
                                    className="w-[280px] sm:w-[360px] md:w-[400px] shrink-0 p-5 sm:p-6 border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex text-[#9E1F1F]">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3.5 h-3.5 fill-[#9E1F1F] text-[#9E1F1F]" />
                                                ))}
                                            </div>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#777777' }}
                                                className="font-sans text-[0.65rem] uppercase tracking-wider font-semibold"
                                            >
                                                {item.date}
                                            </span>
                                        </div>
                                        <p
                                            style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                            className="font-serif italic text-sm sm:text-base leading-relaxed mb-6 font-medium"
                                        >
                                            "{item.comment}"
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                        }}
                                        className="border-t pt-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <h4
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-sans text-xs font-bold"
                                            >
                                                {item.name}
                                            </h4>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#666666' }}
                                                className="font-sans text-[0.7rem]"
                                            >
                                                {item.role}
                                            </span>
                                        </div>
                                        <span
                                            style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                            className="font-sans text-[0.65rem] tracking-widest uppercase font-bold"
                                        >
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
                <section
                    id="barista"
                    style={{
                        background: isDark ? '#161210' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-6 order-2 lg:order-1 reveal-slide-left">
                                <div
                                    style={{
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.25)',
                                    }}
                                    className="editorial-img-wrapper h-[300px] sm:h-[450px] lg:h-[600px] border rounded-2xl overflow-hidden shadow-md"
                                >
                                    <Image
                                        src="/images/kopimage_barista_pouring_1786480929425.webp"
                                        alt="Barista Kopi Mage menyeduh kopi manual brew"
                                        fill
                                        loading="lazy"
                                        quality={80}
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-6 order-1 lg:order-2 reveal-slide-right">
                                <span
                                    style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                    className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold block mb-4"
                                >
                                    07 / RACIKAN KOPI
                                </span>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
                                >
                                    Dedikasi dan presisi dalam setiap seduhan.
                                </h2>
                                <p
                                    style={{ color: isDark ? '#A89F91' : '#444444' }}
                                    className="font-sans text-sm sm:text-base font-light leading-relaxed mb-6"
                                >
                                    Setiap cangkir kopi diseduh dengan ketelitian tinggi oleh barista kami. Dari racikan Es Kopi Susu Signature yang lembut seimbang, hingga seduhan manual brew single origin pilihan dengan profil rasa yang kaya.
                                </p>
                                <blockquote
                                    style={{
                                        color: isDark ? '#D4A373' : '#9E1F1F',
                                        borderLeftColor: '#9E1F1F',
                                    }}
                                    className="border-l-2 pl-6 py-2 my-6 font-serif italic text-lg sm:text-xl font-medium"
                                >
                                    "Kopi berkualitas, racikan jujur, dan kehangatan tulus untuk menemani setiap perbincangan Anda."
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
                <section
                    id="visit"
                    style={{
                        background: isDark ? '#0E0B0A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                    }}
                    className="py-16 lg:py-24 rounded-2xl sm:rounded-3xl border shadow-xl overflow-hidden"
                >
                    <div className="editorial-container">
                        <div
                            style={{
                                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                            }}
                            className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b reveal-fade-up"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span
                                        style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                        className="font-sans text-[0.72rem] tracking-[0.25em] uppercase font-bold"
                                    >
                                        08 / LOKASI 2 CABANG KOPI MAGE
                                    </span>
                                </div>
                                <h2
                                    style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                    className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold"
                                >
                                    Kunjungi Cabang Terdekat
                                </h2>
                            </div>
                            <div
                                style={{ color: isDark ? '#A89F91' : '#555555' }}
                                className="mt-4 md:mt-0 flex flex-wrap gap-4 text-xs font-sans font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} />
                                    <span>Buka Setiap Hari • 07.00 - 23.00 WIB</span>
                                </div>
                            </div>
                        </div>

                        {/* Outlet Tab Selector Buttons */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 reveal-fade-up">
                            <button
                                onClick={() => setActiveOutlet('gading')}
                                style={activeOutlet === 'gading'
                                    ? { background: '#9E1F1F', color: '#FFFFFF', borderColor: '#9E1F1F', fontWeight: 'bold' }
                                    : { background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FAF7F5', color: isDark ? '#FFFFFF' : '#1A1A1A', borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#9E1F1F', fontWeight: '600' }
                                }
                                className="py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-all border rounded-xl shadow-sm cursor-pointer"
                            >
                                1. Cabang Gading Tutuka (Soreang)
                            </button>
                            <button
                                onClick={() => setActiveOutlet('lanud')}
                                style={activeOutlet === 'lanud'
                                    ? { background: '#9E1F1F', color: '#FFFFFF', borderColor: '#9E1F1F', fontWeight: 'bold' }
                                    : { background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FAF7F5', color: isDark ? '#FFFFFF' : '#1A1A1A', borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#9E1F1F', fontWeight: '600' }
                                }
                                className="py-3.5 px-5 sm:px-6 w-full sm:w-auto font-sans text-xs tracking-[0.18em] uppercase transition-all border rounded-xl shadow-sm cursor-pointer"
                            >
                                2. Cabang Lanud Sulaiman (Margahayu)
                            </button>
                        </div>

                        {/* Interactive Live Radar Map Frame */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            {/* Live Map Tracker Embed Frame */}
                            <div
                                style={{
                                    background: isDark ? '#161210' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(158, 31, 31, 0.3)',
                                }}
                                className="lg:col-span-8 relative border overflow-hidden min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] rounded-2xl reveal-scale-pop shadow-sm"
                            >
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
                            <div
                                style={{
                                    background: isDark ? '#161210' : '#FAF7F5',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#9E1F1F',
                                }}
                                className="lg:col-span-4 p-5 sm:p-8 border rounded-2xl shadow-sm flex flex-col justify-between space-y-6 reveal-slide-right"
                            >
                                <div>
                                    <span
                                        style={{ color: isDark ? '#D4A373' : '#9E1F1F' }}
                                        className="font-sans text-[0.72rem] tracking-[0.2em] uppercase font-bold block mb-4"
                                    >
                                        {activeOutlet === 'gading' ? 'INFORMASI CABANG GADING TUTUKA' : 'INFORMASI CABANG LANUD SULAIMAN'}
                                    </span>

                                    <div className="space-y-3 font-sans text-xs mb-6">
                                        <div
                                            style={{
                                                background: isDark ? '#0E0B0A' : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                            }}
                                            className="p-3.5 border rounded-xl shadow-sm transition-colors"
                                        >
                                            <span
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-bold block mb-1"
                                            >
                                                Alamat Cabang
                                            </span>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#333333' }}
                                                className="leading-relaxed block"
                                            >
                                                {activeOutlet === 'gading'
                                                    ? 'Jl. Gading Tutuka No. 88, Soreang, Kab. Bandung (Dekat Tol Seroja)'
                                                    : 'Kawasan Lanud Sulaiman, Margahayu, Kab. Bandung'}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                background: isDark ? '#0E0B0A' : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#9E1F1F',
                                            }}
                                            className="p-3.5 border rounded-xl shadow-sm transition-colors"
                                        >
                                            <span
                                                style={{ color: isDark ? '#FFFFFF' : '#1A1A1A' }}
                                                className="font-bold block mb-1"
                                            >
                                                Jam Operasional
                                            </span>
                                            <span
                                                style={{ color: isDark ? '#A89F91' : '#333333' }}
                                                className="leading-relaxed block font-medium"
                                            >
                                                Buka Setiap Hari: 07.00 - 23.00 WIB
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                        }}
                                        className="space-y-3 pt-4 border-t"
                                    >
                                        <div
                                            style={{ color: isDark ? '#A89F91' : '#333333' }}
                                            className="flex items-center gap-3 text-xs font-medium"
                                        >
                                            <Music className="w-4 h-4 shrink-0" style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} />
                                            <span>Live Music Akustik Setiap Weekend</span>
                                        </div>
                                        <div
                                            style={{ color: isDark ? '#A89F91' : '#333333' }}
                                            className="flex items-center gap-3 text-xs font-medium"
                                        >
                                            <Car className="w-4 h-4 shrink-0" style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} />
                                            <span>Area Parkir Luas (Mobil & Motor)</span>
                                        </div>
                                        <div
                                            style={{ color: isDark ? '#A89F91' : '#333333' }}
                                            className="flex items-center gap-3 text-xs font-medium"
                                        >
                                            <Wifi className="w-4 h-4 shrink-0" style={{ color: isDark ? '#D4A373' : '#9E1F1F' }} />
                                            <span>Koneksi WiFi Cepat & Banyak Colokan</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Direct Google Maps Action Buttons */}
                                <div
                                    style={{
                                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(158, 31, 31, 0.15)',
                                    }}
                                    className="pt-4 border-t mt-auto space-y-3"
                                >
                                    <a
                                        href={
                                            activeOutlet === 'gading'
                                                ? 'https://maps.app.goo.gl/SS6748EDgyeR2Jgh9'
                                                : 'https://maps.app.goo.gl/4d7zB7HYjwocxUwaA'
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#9E1F1F',
                                            color: '#FFFFFF',
                                            borderColor: '#9E1F1F',
                                        }}
                                        className="w-full block text-center py-4 px-4 text-xs tracking-[0.18em] uppercase font-bold hover:opacity-90 transition-opacity border rounded-xl shadow-md relative z-10"
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
