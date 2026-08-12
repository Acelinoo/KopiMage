import type { Metadata } from 'next';
import './globals.css';
import '../styles/globals.css';
import { CartProvider } from '@/context/CartContext';
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
    <html lang="id" style={{ background: '#0C0A09', color: '#F3EFEA', colorScheme: 'dark' }}>
      <body style={{ background: '#0C0A09', color: '#F3EFEA', margin: 0, padding: 0 }}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
