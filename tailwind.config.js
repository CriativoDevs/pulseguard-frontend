/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          foreground: "#e0f2f1",
        },
        surface: {
          DEFAULT: "#0b1724",
          foreground: "#f1f5f9",
        },
      },
    },
  },
  plugins: [],
};
