import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F6F4FA",
          dark: "#0A0A10",
        },
        elevated: {
          DEFAULT: "#FFFFFF",
          dark: "#131019",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1A1626",
        },
        surface2: {
          DEFAULT: "#F0ECF9",
          dark: "#211C30",
        },
        border: {
          DEFAULT: "#E3DDF2",
          dark: "#2C2640",
        },
        bordersoft: {
          DEFAULT: "#ECE7F7",
          dark: "#211D2E",
        },
        ink: {
          DEFAULT: "#1C1730",
          dark: "#F3F1F8",
        },
        dim: {
          DEFAULT: "#665D82",
          dark: "#9C94B0",
        },
        faint: {
          DEFAULT: "#9A90B3",
          dark: "#635A78",
        },
        violet: {
          DEFAULT: "#7C3AED",
          bright: "#B98CF0",
          deep: "#6D2FC7",
          dark: "#9B5DE5",
        },
        mint: "#5EEAD4",
        gold: "#F2C94C",
        coral: "#F97066",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(155,93,229,.4), 0 0 60px rgba(155,93,229,.1)",
        "glow-strong":
          "0 0 0 1px rgba(155,93,229,.5), 0 0 30px rgba(155,93,229,.5)",
        "glow-light": "0 0 20px rgba(124,58,237,.16), 0 0 50px rgba(124,58,237,.06)",
      },
      borderRadius: {
        xl2: "16px",
      },
      keyframes: {
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "spin-slow-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 40s linear infinite",
        "spin-slow-reverse": "spin-slow-reverse 30s linear infinite",
        "pulse-glow": "pulse-glow 2.8s ease-in-out infinite",
        "pulse-glow-fast": "pulse-glow 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
