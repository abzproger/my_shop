import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1f1f",
        paper: "#fbfaf7",
        moss: "#2f6f5e",
        coral: "#d85c4a",
        honey: "#f2b84b"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 31, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
