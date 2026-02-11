/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{tsx,ts}', './components/**/*.{tsx,ts}', './context/**/*.{tsx,ts}', './lib/**/*.ts'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#050508',
          card: '#0f0f13',
          accent: '#d946ef',
          glow: '#a855f7',
          text: '#f8fafc',
          muted: '#94a3b8',
          'muted-light': '#b8c5d6',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
