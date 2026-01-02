/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#4ade80', // Replace with your neon green
        'dark-bg': '#0f172a',
        'surface': '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Or user's preferred font
      },
    },
  },
  plugins: [],
}
