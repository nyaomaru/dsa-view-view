/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        // Digital Agency design system spacing scale
        // Using numeric keys that map to our semantic sizes
        1: '4px', // xs - tightly related elements
        2: '8px', // sm - inside compact components
        4: '16px', // md - standard component spacing
        6: '24px', // lg - larger elements within sections
        8: '32px', // xl - between sections
        12: '48px', // 2xl - between large sections
        16: '64px', // 3xl - main content areas
      },
      colors: {
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
          hover: 'rgb(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / var(--secondary-alpha))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning))',
          foreground: 'rgb(var(--warning-foreground))',
        },
        timeline: {
          'current-foreground': 'rgb(var(--timeline-current-foreground))',
        },
        'heading-gradient': {
          from: 'rgb(var(--heading-gradient-from))',
          to: 'rgb(var(--heading-gradient-to))',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover))',
          foreground: 'rgb(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
        graph: {
          edge: 'rgb(var(--graph-edge))',
          'node-unvisited': 'rgb(var(--graph-node-unvisited))',
          'node-visiting': 'rgb(var(--graph-node-visiting))',
          'node-visited': 'rgb(var(--graph-node-visited))',
          'node-foreground': 'rgb(var(--graph-node-foreground))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
