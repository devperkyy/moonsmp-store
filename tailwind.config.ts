import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#04060d",
          900: "#070b14",
          800: "#0b1120",
          700: "#111a30",
          600: "#1a2745",
        },
        moon: {
          300: "#b8cbff",
          400: "#93b4ff",
          500: "#6b8cff",
          600: "#4f6fe6",
        },
        ember: {
          400: "#ffb454",
          500: "#ff8c2b",
          600: "#ff6a1a",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "'Press Start 2P'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
