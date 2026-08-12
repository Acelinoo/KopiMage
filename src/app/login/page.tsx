'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Coffee, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#161210] border border-[#B82E2E]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#B82E2E] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#B82E2E]/20">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <span className="text-[0.65rem] tracking-widest uppercase font-semibold text-[#C29B7F] block mb-1">KOPIMAGE SYSTEM PORTAL</span>
        <h1 className="text-2xl font-serif font-light text-white">Login Staf &amp; Admin</h1>
        <p className="text-xs text-[#A89F91] mt-1 font-light">Masuk untuk mengelola pesanan, dapur &amp; verifikasi pembayaran.</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1.5">Email Staf / Admin</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              placeholder="admin@kopimage.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
            />
          </div>
        </div>

        <div>
          <label className="text-[0.68rem] tracking-widest uppercase font-semibold text-[#A89F91] block mb-1.5">Kata Sandi</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 text-xs text-white placeholder-[#A89F91] focus:outline-none focus:border-[#B82E2E]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#B82E2E] hover:bg-[#D63434] text-white text-xs font-sans tracking-wider uppercase font-semibold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          <span>{loading ? 'MEMPROSES...' : 'MASUK KE SYSTEM DASHBOARD'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Shortcut Direct Links */}
      <div className="mt-8 pt-6 border-t border-[#FFFFFF]/10 text-center">
        <span className="text-[0.62rem] tracking-widest uppercase text-[#A89F91] block mb-3 font-semibold">AKSES LANGSUNG DEMO SYSTEM:</span>
        <div className="flex flex-col gap-2">
          <Link
            href="/admin"
            className="py-2.5 px-4 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 hover:border-[#B82E2E] text-xs font-serif text-[#C29B7F] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#B82E2E]" />
            <span>Buka Dashboard Admin (/admin)</span>
          </Link>
          <Link
            href="/kitchen"
            className="py-2.5 px-4 rounded-xl bg-[#0E0B0A] border border-[#FFFFFF]/10 hover:border-[#B82E2E] text-xs font-serif text-[#C29B7F] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Coffee className="w-4 h-4 text-emerald-400" />
            <span>Buka Monitor Dapur KDS (/kitchen)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0E0B0A] text-[#FFFFFF] font-sans flex items-center justify-center p-4 sm:p-6 selection:bg-[#B82E2E] selection:text-[#FFFFFF]">
      <Suspense fallback={<div className="text-xs text-[#A89F91]">Memuat Portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
