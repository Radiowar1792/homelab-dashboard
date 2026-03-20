// Tailwind CSS v4 — configuration minimaliste
// Le dark mode est géré via @custom-variant dans globals.css
// Les variables CSS (couleurs, radius) sont définies directement dans globals.css
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
