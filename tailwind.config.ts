import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          }
        },
        '.scrollbar-thumb-gray-300': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#d1d5db',
            borderRadius: '4px'
          }
        },
        '.scrollbar-track-gray-100': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f3f4f6',
            borderRadius: '4px'
          }
        },
        '.hover\\:scrollbar-thumb-gray-400:hover': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#9ca3af'
          }
        }
      })
    }
  ],
};

export default config;
