import type { Metadata } from 'next';
import './globals.css';
import '../styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartDrawer } from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'KOPIMAGE Soreang - Coffee, Drinks & Eats | Gading Tutuka',
  description: 'Kedai Kopi & Kuliner Favorit di Gading Tutuka, Soreang. Menyediakan Es Kopi Susu Signature, Manual Brew, Cemilan Asin/Manis, dan Makanan Berat Lezat.',
  keywords: ['KopiMage', 'KOPIMAGE Soreang', 'Coffee Shop Soreang', 'Gading Tutuka Kopi', 'Es Kopi Susu Soreang'],
  openGraph: {
    title: 'KOPIMAGE Soreang - Coffee, Drinks & Eats',
    description: 'Nikmati sajian kopi pilihan, cemilan, dan makanan khas di Gading Tutuka, Soreang. Buka setiap hari 07.00 - 23.00 WIB.',
    type: 'website',
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
