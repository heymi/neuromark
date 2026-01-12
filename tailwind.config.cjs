module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './types.ts',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        system: {
          bg: '#F5F5F7',
          sidebar: '#FBFBFD',
          panel: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.04)',
          text: '#1D1D1F',
          secondary: '#86868b',
          'dark-bg': '#1D1D1F',
          'dark-sidebar': '#1C1C1E',
          'dark-panel': '#1C1C1E',
          'dark-elevated': '#2C2C2E',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
          'dark-text': '#F5F5F7',
          'dark-secondary': '#98989D',
        },
      },
      fontFamily: {
        sans: ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'soft-hover': '0 20px 40px -6px rgba(0, 0, 0, 0.08), 0 8px 16px -6px rgba(0, 0, 0, 0.04)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
