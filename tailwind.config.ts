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
          primary: {
            amber: "#f59e0b", // amber-500
            orange: "#f97316", // orange-500
            rose: "#f43f5e", // rose-500
          },
          bg: {
            black: "#0f0f0f",
            charcoal: "#171717",
            gray: "#1a1a1a",
          },
          glass: "rgba(0, 0, 0, 0.4)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderRadius: {
        "xl": "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backdropBlur: {
        xl: "24px",
      },
      animation: {
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
      },
      scrollbar: {
        thin: "thin",
      },
    },
  },
  plugins: [],
};
export default config;
