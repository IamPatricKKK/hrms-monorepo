import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(222, 47%, 11%)",
        muted: { DEFAULT: "hsl(210, 20%, 96%)", foreground: "hsl(215, 16%, 47%)" },
        primary: { DEFAULT: "hsl(214, 80%, 35%)", foreground: "hsl(0, 0%, 100%)" },
        secondary: { DEFAULT: "hsl(210, 40%, 96%)", foreground: "hsl(222, 47%, 11%)" },
        accent: { DEFAULT: "hsl(210, 40%, 96%)", foreground: "hsl(222, 47%, 11%)" },
        destructive: { DEFAULT: "hsl(0, 84%, 60%)", foreground: "hsl(0, 0%, 100%)" },
        border: "hsl(214, 32%, 91%)",
        input: "hsl(214, 32%, 91%)",
        ring: "hsl(214, 80%, 35%)",
        sidebar: { DEFAULT: "hsl(217, 33%, 17%)", foreground: "hsl(210, 40%, 90%)" },
      },
      borderRadius: { lg: "0.5rem", md: "0.375rem", sm: "0.25rem" },
    },
  },
  plugins: [],
};

export default config;
