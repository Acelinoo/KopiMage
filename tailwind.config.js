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
        bgDark: '#0C0A09',
        bgDarkPaper: '#14110F',
        bgDarkSurface: '#1C1815',
        textLight: '#F3EFEA',
        textMuted: '#9E9287',
        textSubtle: '#5E564F',
        accentCopper: '#C29B7F',
        accentCopperHover: '#D8AF93',
      },
    },
  },
  plugins: [],
};
