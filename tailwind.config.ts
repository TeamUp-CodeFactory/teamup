import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-sans)", ...fontFamily.sans],
			},
			colors: {
				// Core variables (backwards compatible)
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: {
					1: "hsl(var(--chart-1))",
					2: "hsl(var(--chart-2))",
					3: "hsl(var(--chart-3))",
					4: "hsl(var(--chart-4))",
					5: "hsl(var(--chart-5))",
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},

				// Figma-derived palette (refer to :root --figma-*)
				figma: {
					primary: "hsl(var(--figma-primary))",
					"primary-variant": "hsl(var(--figma-primary-variant))",
					success: "hsl(var(--figma-success))",
					surface: "hsl(var(--figma-surface))",
					"muted-surface": "hsl(var(--figma-muted-surface))",
					"team-bg": "hsl(var(--figma-team-bg))",
					"team-fg": "hsl(var(--figma-team-fg))",
					text: "hsl(var(--figma-text))",
					// Use the base + alpha vars for muted text
					"muted-text": "hsl(var(--figma-muted-text) / var(--figma-muted-text-alpha))",
					danger: "hsl(var(--figma-danger))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
				co: "var(--radius-card-outer)", // 16px cuando --radius es 2.4rem (38.4px)
				ci: "var (--radius-card-inner)", // 8px cuando --radius es 2.4rem (38.4px)
			},
			fontSize: {
				'hero-title': ['var(--hero-title-size)', { lineHeight: 'var(--hero-title-line-height)' }],
				'hero-subtitle': ['var(--hero-subtitle-size)', { lineHeight: 'var(--hero-subtitle-line-height)' }],
				'hero-description': ['var(--hero-description-size)', { lineHeight: 'var(--hero-description-line-height)' }],
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
