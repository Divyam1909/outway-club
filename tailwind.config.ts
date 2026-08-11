import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /**
         * Three surfaces, not five. The old scale had cream-100 and cream-200
         * 1.03:1 apart, which made every alternating section band on the home,
         * why-us and about pages invisible work. What's left is the set a
         * reader can actually tell apart:
         *   200 / DEFAULT — the page ground
         *   100           — raised: cards, the navbar, modals, and type on dark
         *   300           — recessed: alternating bands and inset tiles
         * Use them solid. A recessed band at 50% opacity over the page ground
         * is the invisible tier all over again.
         */
        cream: {
          DEFAULT: "#FBF7F0",
          100: "#FFFFFF",
          200: "#FBF7F0",
          300: "#F0E7D6",
        },
        /**
         * 300 is deliberately darker than 400: it carries information
         * (placeholders, hints) and has to stay legible, where 400 is only
         * ever used to play something down, such as a struck-through price.
         * 200 is decorative — empty stars, off-state icons, separator dots —
         * and must never be the only thing saying something.
         */
        ink: {
          DEFAULT: "#221F1A",
          700: "#3A362E",
          500: "#6B6257",
          400: "#8F8579",
          300: "#847869",
          200: "#C9C0B4",
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
        /** The money colour. 5.0:1 against white, so btn-accent passes AA. */
        clay: {
          DEFAULT: "#B05622",
          50: "#FBEEE5",
          100: "#F3D3BB",
          400: "#D3763F",
          500: "#B05622",
          600: "#A24F22",
          700: "#7C3C1A",
        },
        /**
         * 400 / DEFAULT are for gold *on pine* only — they fail on anything
         * light. 600 is the badge text tone (4.5:1 on gold-100) and 700 is
         * gold type on a cream or white ground (6.0:1).
         */
        gold: {
          DEFAULT: "#D9A441",
          100: "#F6E7C8",
          400: "#D9A441",
          600: "#8A6118",
          700: "#7F5810",
        },
        /**
         * Two jobs, two values. `border` is a hairline divider between things
         * that are already distinct; `border-control` is the edge of an input,
         * select or textarea, which WCAG 1.4.11 requires to hit 3:1 because
         * it's the only thing saying "you can type here".
         */
        border: {
          DEFAULT: "#DED5C2",
          control: "#9C8C6B",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
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
