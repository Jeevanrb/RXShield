/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#050710",
          sidebar: "rgba(9, 11, 23, 0.85)",
          card: "rgba(16, 20, 38, 0.65)",
          cardHover: "rgba(23, 29, 54, 0.8)",
        },
        medical: {
          cyan: "#06b6d4",
          teal: "#0d9488",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          lightBg: "#f8fafc",
          lightCard: "#ffffff",
          lightText: "#1e293b",
        },
        severity: {
          low: "#10b981",       // Green
          moderate: "#eab308",  // Yellow
          high: "#f97316",      // Orange
          critical: "#ef4444",  // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.35)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.35)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.35)',
        'neon-critical': '0 0 20px rgba(239, 68, 68, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'neural-pulse': 'neural 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        neural: {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
