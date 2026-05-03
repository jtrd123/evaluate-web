import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2e006b",
          50:  "#f3eeff",
          100: "#e4d8ff",
          200: "#ccb6ff",
          300: "#aa85ff",
          400: "#8a4fff",
          500: "#722bff",
          600: "#6209ff",
          700: "#5500e8",
          800: "#4500bf",
          900: "#2e006b",
          950: "#1a003d",
        },
        accent: {
          DEFAULT: "#ffd445",
          50:  "#fffbeb",
          100: "#fff3c4",
          200: "#ffe88a",
          300: "#ffd445",
          400: "#ffc41a",
          500: "#f9a800",
          600: "#dd7e00",
          700: "#b75700",
          800: "#943f00",
          900: "#7a3400",
        },
        "base-white": "#ffffff",
        "base-black": "#000000",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Sarabun", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(46,0,107,0.08)",
        "card-hover": "0 8px 32px 0 rgba(46,0,107,0.14)",
        glow: "0 0 0 3px rgba(255,212,69,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
