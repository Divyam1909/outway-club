import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF7F0",
          50: "#FFFFFF",
          100: "#FDFBF8",
          200: "#FBF7F0",
          300: "#F3EBDB",
          400: "#E8DFCC",
        },
        ink: {
          DEFAULT: "#221F1A",
          700: "#3A362E",
          500: "#6B6257",
          400: "#8F8579",
          300: "#B8AFA2",
        },
        pine: {
          DEFAULT: "#1E3D32",
          50: "#EAF0EC",
          100: "#CFDDD5",
          400: "#2C5A49",
          500: "#1E3D32",
          600: "#173025",
          700: "#102019",
        },
        clay: {
          DEFAULT: "#C1622D",
          50: "#FBEEE5",
          100: "#F3D3BB",
          400: "#D3763F",
          500: "#C1622D",
          600: "#A24F22",
          700: "#7C3C1A",
        },
        gold: {
          DEFAULT: "#D9A441",
          100: "#F6E7C8",
          400: "#D9A441",
          600: "#B3822A",
        },
        border: "#E8E1D2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px 0 rgb(34 31 26 / 0.06)",
        card: "0 8px 30px -8px rgb(34 31 26 / 0.15)",
        lifted: "0 20px 60px -15px rgb(34 31 26 / 0.25)",
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
};

export default config;
