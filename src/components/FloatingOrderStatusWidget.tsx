'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Clock, CheckCircle, ChevronUp, ChevronRight, X } from 'lucide-react';
import { CheckoutModal } from '@/components/CheckoutModal';

export const FloatingOrderStatusWidget: React.FC = () => {
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Read active order from LocalStorage
  const checkActiveOrder = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('kopimage_active_table_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveOrder(parsed);
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkActiveOrder();
    // Poll every 3 seconds for live order status update
    const interval = setInterval(async () => {
      checkActiveOrder();
      const stored = localStorage.getItem('kopimage_active_table_order');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.id) {
            const res = await fetch('/api/admin/orders?status=ALL');
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
              const matched = data.orders.find((o: any) => o.id === parsed.id);
              if (matched) {
                setActiveOrder(matched);
                localStorage.setItem('kopimage_active_table_order', JSON.stringify(matched));
              }
            }
          }
        } catch (err) {}
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!activeOrder || isDismissed) return null;

  const isApproved = activeOrder.payment_status === 'PAID';
  const isPreparing = activeOrder.order_status === 'PREPARING';
  const isReady = activeOrder.order_status === 'READY';
  const isCompleted = activeOrder.order_status === 'COMPLETED';

  return (
    <>
      {/* FLOATING ORDER STATUS BAR FOR CUSTOMER */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1rem',
          left: '1rem',
          zIndex: 90,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '460px',
            background: 'linear-gradient(135deg, #161210 0%, #0B0908 100%)',
            border: isReady
              ? '1.5px solid #2ECC71'
              : isApproved
              ? '1.5px solid #D4A373'
              : '1.5px solid #E67E22',
            borderRadius: '16px',
            padding: '0.75rem 1rem',
            boxShadow: isReady
              ? '0 10px 30px rgba(46, 204, 113, 0.25)'
              : '0 10px 30px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            cursor: 'pointer',
          }}
          onClick={() => setIsModalOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isReady
                  ? 'rgba(46, 204, 113, 0.15)'
                  : isApproved
                  ? 'rgba(212, 163, 115, 0.15)'
                  : 'rgba(230, 126, 34, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isReady ? (
                <Coffee className="w-5 h-5 text-[#2ECC71] animate-bounce" />
              ) : isApproved ? (
                <CheckCircle className="w-5 h-5 text-[#D4A373] animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-[#E67E22] animate-spin" style={{ animationDuration: '4s' }} />
              )}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A89F91', fontWeight: 800, fontFamily: 'monospace' }}>
                  PROGRES PESANAN • MEJA {activeOrder.table_id || '01'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: isReady ? '#2ECC71' : isApproved ? '#F7F4EF' : '#E67E22',
                  display: 'block',
                  lineHeight: '1.2',
                }}
              >
                {isReady
                  ? '☕ SIAP DIHIDANGKAN!'
                  : isPreparing
                  ? '👨‍🍳 DIPROSES DAPUR & BARISTA'
                  : isApproved
                  ? '✓ PEMBAYARAN DIVERIFIKASI'
                  : '⏳ MENUNGGU VERIFIKASI ADMIN'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D4A373', fontFamily: 'monospace' }}>
              LIHAT STATUS
            </span>
            <ChevronRight className="w-4 h-4 text-[#D4A373]" />
          </div>
        </motion.div>
      </div>

      {/* POPUP MODAL ON CLICK */}
      {isModalOpen && (
        <CheckoutModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
