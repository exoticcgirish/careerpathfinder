/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe5ff",
          500: "#4f6bff",
          600: "#3b52e6",
          700: "#2e40b8",
          900: "#1a2568",
        },
      },
    },
  },
  plugins: [],
};
