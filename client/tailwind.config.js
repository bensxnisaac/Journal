/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      colors: {
        bg:      'var(--bg)',
        bg2:     'var(--bg2)',
        bg3:     'var(--bg3)',
        bg4:     'var(--bg4)',
        border:  'var(--border)',
        border2: 'var(--border2)',
        primary: 'var(--text)',
        muted:   'var(--muted)',
        bull:    'rgb(0 217 126 / <alpha-value>)',
        bear:    'rgb(255 61 90 / <alpha-value>)',
        acc:     'rgb(45 143 255 / <alpha-value>)',
        gold:    'rgb(255 184 0 / <alpha-value>)',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
