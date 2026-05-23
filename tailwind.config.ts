import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand palette (constant across themes)
        brand: {
          primary: "#1B5E38",
          "primary-hover": "#2D8A4E",
          accent: "#E07B28",
          secondary: "#2D8A4E",
          sky: "#7EC8D8",
          success: "#2D8A4E",
          warning: "#E07B28",
          danger: "#C0392B",
          info: "#7EC8D8",
        },
        // Theme-aware semantic tokens (driven by CSS variables in globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
      },
      letterSpacing: {
        wider: "0.05em",
      },
    },
  },
  plugins: [],
};

export default config;
