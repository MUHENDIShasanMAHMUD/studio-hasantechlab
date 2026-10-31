/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: { display: ['Space Grotesk', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      colors: { ink: '#10151d', paper: '#f5f4ef', signal: '#e5ff55', copper: '#d66a3d' }
    }
  },
  plugins: []
}
