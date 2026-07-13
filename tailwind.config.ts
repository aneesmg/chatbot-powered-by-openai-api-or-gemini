import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        surface: "rgba(255,255,255,0.05)",
        "accent-cyan": "#00E5FF",
        "accent-purple": "#A855F7",
      },
    },
  },
  plugins: [],
};
export default config;
