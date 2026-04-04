import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/**
 * Biarritz Design System — Linear-inspired Tailwind preset.
 *
 * This is the source of truth for all design tokens.
 * See DESIGN.md at the repo root for usage documentation.
 *
 * Color values use oklch() for perceptual uniformity.
 * Comments show approximate hex equivalents for reference only — never use hex in code.
 */
export default {
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (shadcn pattern — used by @biarritz/ui components) ──

        background: "oklch(0.985 0 0)", // #FAFAFA
        foreground: "oklch(0.205 0 0)", // #1C1C1C

        card: {
          DEFAULT: "oklch(1 0 0)", // #FFFFFF
          foreground: "oklch(0.205 0 0)",
        },
        popover: {
          DEFAULT: "oklch(1 0 0)",
          foreground: "oklch(0.205 0 0)",
        },

        // Linear's signature indigo
        primary: {
          DEFAULT: "oklch(0.488 0.177 264.376)", // #5E6AD2
          foreground: "oklch(0.985 0 0)",
        },

        secondary: {
          DEFAULT: "oklch(0.97 0 0)", // #F7F7F7
          foreground: "oklch(0.269 0 0)",
        },

        // Cool-gray muted (0.016 chroma at hue 264 gives Linear's subtle blue tint)
        muted: {
          DEFAULT: "oklch(0.965 0 0)", // #F5F5F5
          foreground: "oklch(0.45 0.016 264)", // #6B6F76 cool-gray
        },

        accent: {
          DEFAULT: "oklch(0.965 0 0)",
          foreground: "oklch(0.269 0 0)",
        },

        destructive: {
          DEFAULT: "oklch(0.577 0.245 27.325)", // #EB5757
          foreground: "oklch(0.985 0 0)",
        },

        border: "oklch(0.90 0.004 264)", // #E5E5E9 — subtle cool shift
        input: "oklch(0.90 0.004 264)",
        ring: "oklch(0.488 0.177 264.376)", // matches primary

        // ── Status colors — use bg-success, text-warning, etc. ──

        success: "oklch(0.527 0.154 163.225)", // #059669
        warning: "oklch(0.769 0.188 84.429)", // #F59E0B
        info: "oklch(0.685 0.169 237.323)", // #0EA5E9
      },

      borderRadius: {
        sm: "calc(0.375rem - 2px)",
        DEFAULT: "0.375rem", // 6px — Linear's tight radius
        md: "0.375rem",
        lg: "calc(0.375rem + 2px)",
        xl: "calc(0.375rem + 4px)",
      },

      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },

  plugins: [
    // ── Layout component classes ──
    // These encode Linear's most common UI patterns so agents use them
    // instead of guessing at utility combinations.
    plugin(function ({ addComponents }) {
      addComponents({
        // Standard 44px page header bar with bottom border
        ".page-header": {
          display: "flex",
          height: "2.75rem",
          flexShrink: "0",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: "1px",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        },

        // Sidebar navigation item with hover/active states
        ".nav-item": {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          borderRadius: "0.375rem",
          paddingLeft: "0.5rem",
          paddingRight: "0.5rem",
          paddingTop: "0.375rem",
          paddingBottom: "0.375rem",
          fontSize: "0.75rem",
          fontWeight: "500",
          color: "oklch(0.45 0.016 264)",
          transitionProperty: "color, background-color",
          transitionDuration: "150ms",
          "&:hover": {
            backgroundColor: "oklch(0.965 0 0)",
            color: "oklch(0.205 0 0)",
          },
          '&[data-active="true"], &.active': {
            backgroundColor: "oklch(0.965 0 0)",
            color: "oklch(0.205 0 0)",
          },
        },

        // Standard list row (issue-list style)
        ".list-row": {
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.375rem",
          paddingBottom: "0.375rem",
          transitionProperty: "background-color",
          transitionDuration: "150ms",
          "&:hover": {
            backgroundColor: "oklch(0.965 0 0)",
          },
        },

        // Uppercase tracking-wider section label
        ".section-heading": {
          fontSize: "11px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "oklch(0.45 0.016 264)",
        },
      });
    }),
  ],
} satisfies Config;
