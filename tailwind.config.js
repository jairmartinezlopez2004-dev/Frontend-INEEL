  /** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Tipografía del sistema: Inter (empaquetada con @fontsource, no depende
      // de internet), con las del sistema operativo como respaldo.
      // Colores institucionales del INEEL, tomados del logotipo:
      // azul marino (#2B4A80 = azul-700) y verde hoja (#63A74A = verde-500).
      colors: {
        azul: {
          50: '#eef3f9', 100: '#d9e3f1', 200: '#b8cbe4', 300: '#8eabd2', 400: '#6589bd',
          500: '#4a6c9b', 600: '#3a5a8e', 700: '#2b4a80', 800: '#233d69', 900: '#1d3256', 950: '#13213a',
        },
        verde: {
          50: '#f0f8ec', 100: '#def0d5', 200: '#bfe1ae', 300: '#9bcf82', 400: '#7dbb62',
          500: '#63a74a', 600: '#4f8b39', 700: '#3f6e2f', 800: '#345828', 900: '#2c4a23', 950: '#152810',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
