import type { Config } from "tailwindcss";

/**
 * Design tokens are taken directly from the provided design
 * ("Radar Kleszczy.dc.html"). Colours, radii and fonts mirror the prototype
 * so the built app preserves its visual style.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        sand: "#ECE7DC", // page background
        card: "#F7F5EE", // main app column
        panel: "#F1EEE4", // inset panels / chips (unselected wash)
        "panel-border": "#E4E0D3",
        "field-border": "#E7E3D7",
        "map-bg": "#EEF2E9",
        "map-border": "#E1E4D8",
        // Brand green
        forest: {
          DEFAULT: "#14584A",
          600: "#124F43",
          700: "#0F463B",
          800: "#0E3F35",
        },
        // Green tint (info / selected)
        mint: "#E7F0EA",
        "mint-border": "#CFE3D8",
        // Accent
        gold: "#F6C453",
        // Text
        ink: "#17231F",
        slate: "#3B4A44",
        muted: "#5F6E68",
        faint: "#8A968F",
        hint: "#A3AEA7",
        // Warning (amber)
        "amber-bg": "#FBF3E9",
        "amber-border": "#EAD9C2",
        "amber-ink": "#B4622F",
        "amber-soft": "#5F4636",
        // Alarm (red)
        "alarm-bg": "#FBEEE8",
        "alarm-border": "#E3B7A6",
        "alarm-ink": "#C1502E",
        "alarm-soft": "#7A3A22",
        "alarm-strong": "#B4462A",
        // Intensity scale (heatmap)
        "risk-low": "#86B08A",
        "risk-med": "#E0A24C",
        "risk-high": "#CE6A4E",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        xl2: "14px",
      },
      keyframes: {
        rkFade: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        rkBlob: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
      },
      animation: {
        rkFade: "rkFade .3s ease both",
        rkBlob: "rkBlob 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
