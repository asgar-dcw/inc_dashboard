/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#1A1D24',
          bgAlt: '#1C2027',
          secondary: '#22262D',
          secondaryAlt: '#282C34',
        },
        accent: {
          DEFAULT: '#F76C2F',
          hover: '#FF8A50',
          light: '#FFB085',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#D0D0D0',
          muted: '#A0A0A0',
        },
        button: {
          dark: '#33373E',
          darkAlt: '#3A3F47',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to bottom, #3A3F47, #282C34)',
      },
    },
  },
  plugins: [],
};
