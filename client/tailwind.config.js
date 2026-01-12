/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cs: {
          dark: '#0d0d12',
          darker: '#08080c',
          surface: '#12121a',
          gold: '#d4a84b',
          orange: '#c76e2e',
          red: '#c43c3c',
          purple: '#a855f7',
          blue: '#4361ee',
          cyan: '#38bdf8',
          green: '#4ade80',
        },
      },
      fontFamily: {
        cs: ['Rajdhani', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
