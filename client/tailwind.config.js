/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#06080b',
        bg2:     '#0b0f14',
        bg3:     '#10161d',
        bg4:     '#141c24',
        border:  '#1a2535',
        border2: '#223040',
        bull:    '#00d97e',
        bear:    '#ff3d5a',
        acc:     '#2d8fff',
        gold:    '#ffb800',
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
