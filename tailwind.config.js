/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Professional color palette
        primary: {
          50: '#f0f5ff',
          100: '#e6eeff',
          200: '#c4dbff',
          300: '#a2c0ff',
          400: '#6090ff',
          500: '#2460ff', // Main brand color
          600: '#1c4cd6',
          700: '#1538ad',
          800: '#0d2485',
          900: '#06135c'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        // Dark mode specific colors
        dark: {
          background: '#0f172a', // Slate-900
          surface: '#1e293b', // Slate-800
          text: {
            primary: '#f8fafc', // Slate-50
            secondary: '#e2e8f0', // Slate-200
            muted: '#94a3b8' // Slate-500
          },
          border: '#334155' // Slate-700
        },
        // Button color variants
        button: {
          primary: {
            DEFAULT: '#2460ff',
            hover: '#1c4cd6',
            text: '#ffffff',
            dark: {
              DEFAULT: '#3b82f6', // A slightly lighter blue for dark mode
              hover: '#60a5fa',
              text: '#ffffff'
            }
          },
          secondary: {
            DEFAULT: '#6b7280', // neutral-500
            hover: '#4b5563',
            text: '#ffffff',
            dark: {
              DEFAULT: '#475569', // slate-600
              hover: '#64748b', // slate-500
              text: '#ffffff'
            }
          },
          outline: {
            DEFAULT: 'transparent',
            border: '#6b7280',
            text: '#6b7280',
            hover: {
              background: '#f3f4f6',
              text: '#374151'
            },
            dark: {
              border: '#94a3b8', // slate-500
              text: '#94a3b8',
              hover: {
                background: '#1e293b', // slate-800
                text: '#e2e8f0' // slate-200
              }
            }
          }
        }
      },
      boxShadow: {
        // Refined, subtle shadows
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        // Dark mode shadow
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
      },
      borderRadius: {
        // More refined corner radiuses
        DEFAULT: '0.375rem', // 6px
        lg: '0.5rem',        // 8px
        xl: '0.75rem'        // 12px
      }
    },
  },
  plugins: [],
}
