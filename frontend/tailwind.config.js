/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          500: "#1d8f64",
          600: "#177a55",
          700: "#136345"
        },
        accent: {
          50: "#f0f9ff",
          500: "#3b82f6"
        },
        warning: {
          50: "#fef3c7",
          500: "#f59e0b"
        }
      }
    }
  },
  plugins: []
};
