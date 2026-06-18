/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#ffffff',
          dark: '#050505',
          cardLight: '#f8f9fa',
          cardDark: '#0e0e0e',
        },
        primary: {
          DEFAULT: '#3b82f6',
          glow: '#60a5fa',
        },
        accent: {
          neon: '#ccff00',
          pink: '#ff00ff',
          purple: '#8a2be2'
        },
        navy: {
          light: '#172a45',
          DEFAULT: '#0a192f',
          dark: '#020c1b',
          accent: '#1e3a8a',
        },
        gold: {
          light: '#f5d061',
          DEFAULT: '#d4af37',
          dark: '#b08d1a',
        },
        paper: {
          DEFAULT: '#fafafa',
          dark: '#0a0a0a',
          card: '#ffffff',
          cardDark: '#121212',
          border: '#e5e5e5',
          borderDark: '#262626',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
        serif: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        '3d-light': '10px 10px 20px #d1d1d1, -10px -10px 20px #ffffff',
        '3d-dark': '10px 10px 20px #040404, -10px -10px 20px #101010',
        'float-light': '0px 20px 40px -10px rgba(0,0,0,0.1)',
        'float-dark': '0px 20px 40px -10px rgba(0,0,0,0.8)',
        'neon': '0 0 20px rgba(204, 255, 0, 0.4)',
        'purple-glow': '0 0 30px rgba(138, 43, 226, 0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
