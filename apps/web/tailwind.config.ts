import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#080b12",
          surface: "#0f1422",
          elevated: "#181f33",
          border: "#232d4b",
          borderHighlight: "#3b4870",
          text: "#f8fafc",
          muted: "#94a3b8",
          dimmed: "#64748b",
        },
        electric: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        violetStudio: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        pitch: {
          excellent: "#10b981",
          inTune: "#06b6d4",
          near: "#f59e0b",
          review: "#f97316",
          outOfTune: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'studio-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(35, 45, 75, 0.5)',
        'studio-glow': '0 0 25px -5px rgba(59, 130, 246, 0.15)',
      }
    },
  },
  plugins: [],
} satisfies Config;
