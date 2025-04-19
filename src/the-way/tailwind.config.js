/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        sm: ['0 1px 2px 0 rgba(0, 0, 0, 0.05)'],
      },
    },
  },
  plugins: [],
} 