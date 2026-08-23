/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Основа: графит. Тъмните ленти, хедърът, футърът, целият основен текст. */
        graphite: {
          50: '#F1F3F5',
          100: '#E3E6EA',
          200: '#C7CDD5',
          300: '#A3ACB9',
          400: '#77828F',
          500: '#525C68',
          600: '#3A424C',
          700: '#2A3038',
          800: '#1C2128',
          900: '#14181D',
          950: '#0C0F12',
        },
        /* Акцент: тухла. Само за CTA, активни състояния и числа, които трябва да се видят. */
        brick: {
          50: '#FDF3EE',
          100: '#FADFD1',
          200: '#F4BC9F',
          300: '#EC9268',
          400: '#DF6B3B',
          500: '#C74A17',
          600: '#A83B0D',
          700: '#8A310C',
          800: '#6B2609',
          900: '#4C1B07',
        },
        /* Топло сиво-бежово: светлите ленти. Никога плоско бяло на цял екран. */
        sand: {
          50: '#FBF9F6',
          100: '#F4F1EA',
          200: '#E9E3D8',
          300: '#D8D0C0',
          400: '#BEB3A0',
        },
      },
      fontFamily: {
        display: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.06', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.625rem, 3vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.25rem, 2vw, 1.5rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
      maxWidth: {
        prose: '68ch',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
};
