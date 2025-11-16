/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        qb: {
          magenta: '#E91E8C',
          purple: '#8B3FE8',
          cyan: '#00D4FF',
          yellow: '#FFD700',
          orange: '#FF6B35',
          lime: '#B4FF39',
          dark: '#0F0F1E',
          darker: '#080812',
          card: '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
