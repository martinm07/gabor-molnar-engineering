/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,svelte,html}"],
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: "#0b0b09",
          50: "#f4f4f1",
          100: "#e8e8e3",
          200: "#d1d1c7",
          300: "#babaab",
          400: "#a3a38f",
          500: "#8c8c73",
          600: "#70705c",
          700: "#545445",
          800: "#38382e",
          900: "#1c1c17",
          950: "#0e0e0b",
        },
        background: {
          DEFAULT: "#f8f8f7",
          50: "#f3f3f1",
          100: "#e7e7e4",
          200: "#d0d0c8",
          300: "#b8b8ad",
          400: "#a0a092",
          500: "#888877",
          600: "#6d6d5f",
          700: "#525247",
          800: "#37372f",
          900: "#1b1b18",
          950: "#0e0e0c",
        },
        rock: {
          DEFAULT: "#8e937b",
          50: "#f3f4f1",
          100: "#e7e8e3",
          200: "#cfd1c7",
          300: "#b7baab",
          400: "#9fa38f",
          500: "#878c73",
          600: "#6c705c",
          700: "#515445",
          800: "#36382e",
          900: "#1b1c17",
          950: "#0d0e0b",
        },
        steel: {
          DEFAULT: "#b8c3b6",
          50: "#f1f4f1",
          100: "#e4e8e3",
          200: "#c8d1c7",
          300: "#adbaab",
          400: "#92a38f",
          500: "#778c73",
          600: "#5f705c",
          700: "#475445",
          800: "#2f382e",
          900: "#181c17",
          950: "#0c0e0b",
        },
        oxygen: {
          DEFAULT: "#9aac9d",
          50: "#f1f4f1",
          100: "#e3e8e4",
          200: "#c7d1c9",
          300: "#abbaad",
          400: "#8fa392",
          500: "#738c77",
          600: "#5c705f",
          700: "#455447",
          800: "#2e3830",
          900: "#171c18",
          950: "#0b0e0c",
        },
      },
    },
  },
  plugins: [],
};