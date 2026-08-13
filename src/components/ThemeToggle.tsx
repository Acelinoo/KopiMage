'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showText = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-var-border transition-all duration-200 cursor-pointer hover:border-var-brand-red ${className}`}
      style={{
        background: 'var(--bg-surface-elevated)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      {isDark ? (
        <Sun size={16} className="text-[#C29B7F] hover:text-[#B82E2E] transition-colors" />
      ) : (
        <Moon size={16} className="text-[#B82E2E] transition-colors" />
      )}
      {showText && (
        <span className="text-[0.72rem] font-sans font-semibold tracking-wider uppercase">
          {isDark ? 'LIGHT' : 'DARK'}
        </span>
      )}
    </button>
  );
};
