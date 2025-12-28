import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warmwind: {
          'deep-black': '#0f0f0f',
          'charcoal': '#171717',
          'dark-gray': '#1a1a1a',
          'amber': {
            500: '#f59e0b',
            600: '#d97706',
          },
          'orange': {
            500: '#f97316',
            600: '#ea580c',
          },
          'rose': {
            500: '#f43f5e',
            600: '#e11d48',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '20px',
        '2xl': '40px',
      },
      borderRadius: {
        'glass': '1rem',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
};
export default config;
