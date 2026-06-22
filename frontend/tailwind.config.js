/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false,
    container: false,
    visibility: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        ink: "#111827",
      },
    },
  },
  plugins: [],
};
