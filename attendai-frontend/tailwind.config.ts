import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette - iOS system blue, deepening to navy for dark surfaces
        brand: {
          50: "#EAF4FF",
          100: "#D2E7FF",
          200: "#A9D0FF",
          300: "#74B0FF",
          400: "#3D90FF",
          500: "#0A84FF",
          600: "#0066E6",
          700: "#0050B5",
          800: "#003A85",
          900: "#00214D",
        },
        ink: {
          50: "#F5F7FA",
          100: "#E9EDF3",
          200: "#D2D9E4",
          300: "#A3ADBF",
          400: "#6E7889",
          500: "#4C5566",
          600: "#3A4250",
          700: "#272D38",
          800: "#171B22",
          900: "#0B0E13",
        },
        canvas: {
          DEFAULT: "#EEF2F8", // cool off-white background
          alt: "#E3E9F2",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.66)",
          strong: "rgba(255, 255, 255, 0.86)",
          dark: "rgba(0, 33, 77, 0.55)",
        },
        accent: {
          amber: "#E0922A",
          rose: "#FF3B57",
          ocean: "#0A84FF",
          violet: "#5E5CE6",
          teal: "#30C8C9",
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
        glass: "0 1px 2px rgba(10, 60, 120, 0.05), 0 8px 24px rgba(10, 60, 120, 0.08)",
        "glass-lg": "0 2px 4px rgba(10, 60, 120, 0.07), 0 18px 44px rgba(10, 60, 120, 0.14)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
        glow: "0 0 0 1px rgba(10, 132, 255, 0.18), 0 8px 30px rgba(10, 132, 255, 0.22)",
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
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
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
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in": "slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
