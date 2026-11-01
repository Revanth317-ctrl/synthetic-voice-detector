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
        cyber: {
          darkest: '#07090E',
          darker: '#0B0F19',
          card: '#111827',
          surface: '#1E293B',
          border: '#334155',
          accent: '#06B6D4',
          accentGlow: '#0891B2',
          blue: '#3B82F6',
          bonafide: '#10B981',
          bonafideBg: 'rgba(16, 185, 129, 0.12)',
          spoof: '#F43F5E',
          spoofBg: 'rgba(244, 63, 94, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        'rose-glow': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
        'emerald-glow': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
