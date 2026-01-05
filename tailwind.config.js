/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hardwario: {
          gray: '#6B6A6A',
          dark: '#252532',
          hover: '#4d4d4d',
          warning: '#ffe100',
          danger: '#e40328',
          success: '#A2E5A7',
          primary: '#2196F3',
        },
      },
      animation: {
        blink: 'blinker 500ms linear infinite',
        'slide-left': 'slideLeft 0.2s forwards',
        'slide-right': 'slideRight 0.2s forwards',
      },
      keyframes: {
        blinker: {
          '50%': { opacity: '0' },
        },
        slideLeft: {
          '0%': { width: '100%' },
          '100%': { width: '0px' },
        },
        slideRight: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};
