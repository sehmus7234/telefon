/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode 'class' -> karanlık tema <html class="dark"> ile açılır/kapanır (prompt 14).
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
}
