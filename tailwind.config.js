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
        brand: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          200: '#f7d5d9',
          300: '#f0b3bb',
          400: '#e58594',
          500: '#d75a6f',
          600: '#c23c54',
          700: '#a32b42',
          800: '#882639',
          900: '#732434',
        }
      }
    },
  },
  plugins: [],
}
