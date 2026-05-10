/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        forge: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#090e1a',
        },
        accent: {
          emerald: '#10b981',
          amber:   '#f59e0b',
          rose:    '#f43f5e',
          sky:     '#0ea5e9',
          violet:  '#8b5cf6',
        },
      },
      borderRadius: {
        forge: '12px',
      },
      boxShadow: {
        'forge-sm':   '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
        'forge-md':   '0 4px 16px rgba(0,0,0,0.35)',
        'forge-lg':   '0 8px 32px rgba(0,0,0,0.4)',
        'forge-glow': '0 0 20px rgba(99,102,241,0.35)',
      },
      backgroundImage: {
        'forge-gradient':       'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'forge-gradient-dark':  'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
        'forge-radial':         'radial-gradient(ellipse at top, #1e1b4b 0%, #090e1a 70%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-right':  'slideRight 0.25s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { from: { transform: 'translateX(-12px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
