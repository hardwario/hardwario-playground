/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        hardwario: {
          // Brand colors from brandbook
          gray: '#6b6a6a',         // Grey - RGB: 107, 106, 106
          primary: '#009cfa',      // Bright Blue - RGB: 0, 156, 250
          medium: '#016ad4',       // Medium Blue - RGB: 1, 106, 212
          dark: '#06367a',         // Dark Blue - RGB: 6, 54, 122
          danger: '#e30427',       // Red - RGB: 227, 4, 39
          nearblack: '#252532',    // Near Black - RGB: 37, 37, 50
          // Additional UI colors
          hover: '#4d4d4d',
          warning: '#ffe100',
          success: '#A2E5A7',
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
