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
          DEFAULT: '#fbfaf5', // Off-white premium newspaper background
          dark: '#121212',
          card: '#ffffff',
          cardDark: '#1d1d1d',
          border: '#e5e5e0',
          borderDark: '#2a2a2a',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
