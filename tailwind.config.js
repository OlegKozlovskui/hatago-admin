/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hatago: {
          dark: '#0b1020',
          accent: '#0f766e',
        },
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
