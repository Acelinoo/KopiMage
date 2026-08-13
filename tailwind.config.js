/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      },
      colors: {
        bgMain: 'var(--bg-main)',
        bgSurface: 'var(--bg-surface)',
        bgSurfaceElevated: 'var(--bg-surface-elevated)',
        bgDark: 'var(--bg-main)',
        bgDarkPaper: 'var(--bg-surface)',
        bgDarkSurface: 'var(--bg-surface-elevated)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textLight: 'var(--text-primary)',
        textMuted: 'var(--text-muted)',
        textSubtle: 'var(--text-subtle)',
        accentCopper: 'var(--brand-copper)',
        accentCopperHover: 'var(--brand-copper)',
        brandRed: 'var(--brand-red)',
        brandRedHover: 'var(--brand-red-hover)',
        borderColor: 'var(--border-color)',
      },
    },
  },
  plugins: [],
};
