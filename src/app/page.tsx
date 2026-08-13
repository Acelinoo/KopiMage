import React from 'react';
import { EditorialHeader } from '@/components/brand/EditorialHeader';
import { EditorialHome } from '@/components/brand/EditorialHome';
import { EditorialFooter } from '@/components/brand/EditorialFooter';
import { QROrderingView } from '@/components/qr/QROrderingView';

export const metadata = {
  title: 'KOPIMAGE Soreang — Luxury Hospitality & Coffee Brand',
  description: 'Ruang berteduh & kedai kopi pilihan di Gading Tutuka, Soreang. Menyajikan kopi pilihan, cemilan khas, dan pengalaman table ordering digital.',
};

export default function HomePage({
  searchParams,
}: {
  searchParams?: { table?: string };
}) {
  const tableId = searchParams?.table;

  // If customer accesses via QR code e.g. /?table=07, render QROrderingView
  if (tableId) {
    return <QROrderingView tableId={tableId} />;
  }

  // Otherwise, render Public Digital Brand Experience Visual Essay
  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease, color 0.25s ease' }} className="min-h-screen flex flex-col justify-between">
      <EditorialHeader />
      <main className="flex-1">
        <EditorialHome />
      </main>
      <EditorialFooter />
    </div>
  );
}
