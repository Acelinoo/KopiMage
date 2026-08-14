import type { Metadata } from 'next';
import './globals.css';
import '../styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartDrawer } from '@/components/CartDrawer';

export const metadata: Metadata = {
  metadataBase: new URL('https://kopimage.vercel.app'),
  title: 'KOPIMAGE — Industrial Coffee Space & Roastery | Soreang & Sulaiman',
  description: 'Kedai Kopi & Kuliner Favorit di Gading Tutuka (Soreang) dan Lanud Sulaiman (Margahayu). Menyediakan Kopi Racikan Signature, Manual Brew, Cemilan, dan Makanan Lezat.',
  keywords: ['KopiMage', 'KOPIMAGE Soreang', 'Coffee Shop Soreang', 'Gading Tutuka Kopi', 'Lanud Sulaiman Kopi', 'Kopi Mage Bandung'],
  openGraph: {
    title: 'KOPIMAGE — Industrial Coffee Space & Roastery',
    description: 'A place to slow down, converse, and appreciate the honest art of hospitality. 2 Cabang: Gading Tutuka & Lanud Sulaiman.',
    url: 'https://kopimage.vercel.app',
    siteName: 'KOPIMAGE',
    images: [
      {
        url: '/images/Banner.webp',
        width: 1200,
        height: 630,
        alt: 'KOPIMAGE Industrial Coffee Space & Roastery',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KOPIMAGE — Industrial Coffee Space & Roastery',
    description: 'Nikmati sajian kopi pilihan dan suasana industrial hangat di Gading Tutuka & Lanud Sulaiman.',
    images: ['/images/Banner.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var THEME_VERSION = '2';
                  var storedVersion = localStorage.getItem('kopimage_theme_v');
                  if (storedVersion !== THEME_VERSION) {
                    localStorage.setItem('kopimage_theme', 'light');
                    localStorage.setItem('kopimage_theme_v', THEME_VERSION);
                  }
                  var stored = localStorage.getItem('kopimage_theme');
                  var theme = (stored === 'light' || stored === 'dark') ? stored : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
