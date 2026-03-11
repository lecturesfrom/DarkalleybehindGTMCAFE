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
        // Dark alley brand palette
        bg: {
          page: "#0A0A0F",
          surface: "#141420",
          elevated: "#222238",
        },
        text: {
          primary: "#F0F0F5",
          secondary: "#9494A8",
          muted: "#5C5C72",
        },
        accent: {
          green: "#00FF88",
          amber: "#FFB800",
          red: "#FF4757",
        },
        border: {
          DEFAULT: "#2A2A3E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "flicker": "flicker 3s linear infinite",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.2)" },
        },
        "flicker": {
          "0%, 95%, 100%": { opacity: "1" },
          "96%": { opacity: "0.8" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.6" },
          "99%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
