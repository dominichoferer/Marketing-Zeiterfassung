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
        sans: ['Futura', 'Century Gothic', 'Trebuchet MS', 'Gill Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        heron: {
          navy: '#1a365d',
          blue: '#2c5282',
          light: '#4da3db',
          bg: '#f0f4f8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
