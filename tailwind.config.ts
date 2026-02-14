import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "pulse-recording": "pulse-recording 1.5s ease-in-out infinite",
        "wave": "wave 1s ease-in-out infinite",
      },
      keyframes: {
        "pulse-recording": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        "wave": {
          "0%, 100%": { height: "8px" },
          "50%": { height: "32px" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
