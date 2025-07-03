/** @type {import('tailwindcss').Config} */
let theme = '#097647'
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      fontFamily:{
        Inconsolata: ['Inconsolata', 'Arial'],
      },
      colors:{
        'theme': theme,
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}