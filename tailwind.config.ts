import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        en: ["'Poppins'", "system-ui", "-apple-system", "sans-serif"],
        ar: ["'Cairo'", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#0B1E3D",
          mid: "#1C3557",
        },
        secondary: {
          DEFAULT: "#00C2A8",
          lt: "#EFF7F6",
        },
        accent: "#F5A623",
        surface: "#F8F9FA",
        "text-muted": "#5A6A7A",
        danger: "#E74C3C",
        warning: "#F39C12",
        success: "#27AE60",
      },
      borderRadius: {
        "brand-sm": "6px",
        "brand-md": "10px",
        "brand-lg": "16px",
      },
    },
  },
  plugins: [],
};
export default config;
