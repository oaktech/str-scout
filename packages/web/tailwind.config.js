/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scout: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          muted: '#94a3b8',
          accent: '#3b82f6',
          success: '#22c55e',
          warning: '#eab308',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
