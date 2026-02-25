/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:      '#FAF7F2',
        parchment:  '#F3EDE4',
        sand:       '#E8DFD3',
        stone:      '#B8AFA3',
        walnut:     '#8C8177',
        charcoal:   '#4A4541',
        ink:        '#2C2825',
        espresso:   '#1A1816',
        emerald: {
          DEFAULT: '#1A6B5C',
          light:   '#E8F5F0',
          dark:    '#145A4C',
        },
        gold: {
          DEFAULT: '#C4963C',
          light:   '#FDF6E9',
          dark:    '#A67D30',
        },
        coral: {
          DEFAULT: '#D4564E',
          light:   '#FDF0EF',
          dark:    '#B84840',
        },
      },
      fontFamily: {
        serif:  ['"Instrument Serif"', 'Georgia', 'serif'],
        body:   ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:   ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(44, 40, 37, 0.06), 0 1px 2px rgba(44, 40, 37, 0.04)',
        'card-hover': '0 8px 25px rgba(44, 40, 37, 0.08), 0 2px 6px rgba(44, 40, 37, 0.04)',
        'elevated': '0 12px 40px rgba(44, 40, 37, 0.12), 0 4px 12px rgba(44, 40, 37, 0.06)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out both',
        'slide-up':  'slideUp 0.5s ease-out both',
        'scale-in':  'scaleIn 0.3s ease-out both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
