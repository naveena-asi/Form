/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // VENUSPRO brand — deep navy/indigo primary
        navy: {
          50: '#eef1fa',
          100: '#d6dcf2',
          200: '#aeb9e4',
          300: '#8090d2',
          400: '#5468bd',
          500: '#36499f',
          600: '#28377d',
          700: '#25336b',
          800: '#1b2a5b',
          900: '#141f44',
          950: '#0c1430',
        },
        // mevak signature — emerald accent
        brand: {
          50: '#ecfdf3',
          100: '#d1fadf',
          200: '#a6f4c5',
          300: '#6ce9a6',
          400: '#32d583',
          500: '#16a34a',
          600: '#15803d',
          700: '#13692f',
          800: '#13532b',
          900: '#114526',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        pop: '0 4px 12px -2px rgb(16 24 40 / 0.10), 0 2px 6px -2px rgb(16 24 40 / 0.06)',
      },
      maxWidth: {
        shell: '1320px',
      },
    },
  },
  plugins: [forms({ strategy: 'class' })],
}
