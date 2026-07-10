/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFD700',   // Gold
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#008080',   // Teal
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#800080',   // Purple
          foreground: '#FFFFFF',
        },
        dark: {
          DEFAULT: '#000000',
          card: '#0A0A0A',
          border: '#1A1A1A',
          hover: '#111111',
        },
        muted: {
          DEFAULT: '#9CA3AF',
          foreground: '#6B7280',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'teal-gradient': 'linear-gradient(135deg, #008080 0%, #00B3B3 100%)',
        'hero-gradient': 'linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
        'countdown': 'countdown 1s ease-in-out infinite',
        'brand-intro': 'brand-intro 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'splash-logo': 'splash-logo 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'splash-text': 'splash-text 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'letter-reveal': 'letter-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'progress-fill': 'progress-fill 2.5s cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 215, 0, 0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'brand-intro': {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(-10px) rotateX(20deg)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0) rotateX(0deg)', filter: 'blur(0)' },
        },
        'splash-logo': {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)', filter: 'blur(10px)', letterSpacing: '-0.05em' },
          '30%': { opacity: '1', transform: 'scale(1.1) translateY(0)', filter: 'blur(0)', letterSpacing: '0.02em' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)', filter: 'blur(0)', letterSpacing: 'normal' },
        },
        'splash-text': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'letter-reveal': {
          '0%': { opacity: '0', transform: 'translateY(40px) rotateX(-90deg)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotateX(0deg)', filter: 'blur(0)' },
        },
        'progress-fill': {
          '0%': { width: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { width: '100%', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'teal': '0 0 20px rgba(0, 128, 128, 0.3)',
      },
    },
  },
  plugins: [],
};
