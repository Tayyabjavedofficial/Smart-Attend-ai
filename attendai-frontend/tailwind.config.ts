import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette - deep institutional teal with warm accents
        brand: {
          50: "#E7F4EF",
          100: "#C7E6D9",
          200: "#9FD3BC",
          300: "#6FBD9C",
          400: "#3FA47A",
          500: "#1D9E75",
          600: "#0F6E56",
          700: "#0A523F",
          800: "#063828",
          900: "#031E16",
        },
        ink: {
          50: "#F6F5F0",
          100: "#EDEAE0",
          200: "#D6D2C2",
          300: "#A8A496",
          400: "#73726C",
          500: "#4F4E4A",
          600: "#3D3D3A",
          700: "#2A2A28",
          800: "#1A1A19",
          900: "#0D0D0C",
        },
        canvas: {
          DEFAULT: "#F4F1EA", // warm off-white background
          alt: "#EDE9DF",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.62)",
          strong: "rgba(255, 255, 255, 0.85)",
          dark: "rgba(6, 56, 40, 0.55)",
        },
        accent: {
          amber: "#D08C3A",
          rose: "#C2576B",
          ocean: "#3B7DA8",
        },
      },
      fontFamily: {
        // Distinctive editorial + technical pairing
        display: ["'Instrument Serif'", "Georgia", "serif"],
        sans: ["'Geist'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        glass: "0 1px 2px rgba(6, 56, 40, 0.04), 0 8px 24px rgba(6, 56, 40, 0.06)",
        "glass-lg": "0 2px 4px rgba(6, 56, 40, 0.06), 0 16px 40px rgba(6, 56, 40, 0.10)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      },
      backgroundImage: {
        "grain":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
