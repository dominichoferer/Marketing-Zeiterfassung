import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['FuturaPT', 'Futura', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f7fb',
          100: '#daedf8',
          200: '#b3d9f0',
          300: '#7bbde4',
          400: '#3d9cd4',
          500: '#1280bd',
          600: '#005a9a', // Primary
          700: '#004b82',
          800: '#003b67',
          900: '#002b4d',
          950: '#001c33',
        },
      },
    },
  },
  plugins: [],
};

export default config;
