/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxHeight: {
        '[500px]': '500px',
        '[400px]': '400px'
      },
      gridTemplateColumns: {
        'auto-fill-64': 'repeat(auto-fill, 16rem)',
      },
    },
  },
  plugins: [
  ],
}

