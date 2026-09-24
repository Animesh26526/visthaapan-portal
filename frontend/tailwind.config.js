import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#002541",
        "primary-container": "#0b3b60",
        "on-primary-container": "#7fa6d0",
        "on-primary": "#ffffff",
        "secondary": "#d9531e",
        "secondary-container": "#ff6e38",
        "on-secondary-container": "#611b00",
        "tertiary": "#002a0d",
        "tertiary-container": "#004318",
        "on-tertiary-container": "#5db56c",
        "surface": "#f8fafc",
        "surface-dim": "#e2e8f0",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f1f5f9",
        "surface-container": "#e2e8f0",
        "surface-container-high": "#cbd5e1",
        "surface-container-highest": "#94a3b8",
        "on-surface": "#0f172a",
        "on-surface-variant": "#334155",
        "outline": "#64748b",
        "outline-variant": "#cbd5e1",
        "gov-navy": "#0b3b60",
        "gov-navy-dark": "#002541",
        "india-saffron": "#d9531e",
        "india-green": "#1b7837",
        "slate-ink": "#0f172a",
        "slate-muted": "#334155",
        "slate-subtle": "#64748b",
        "error": "#ba1a1a",
        "error-container": "#ffdad6"
      },
      fontFamily: {
        sans: ["Public Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
