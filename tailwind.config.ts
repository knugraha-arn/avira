import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:         '#0344D8',
          'blue-hover': '#387EE4',
          lime:         '#D1EA2C',
          amber:        '#FFC128',
          navy:         '#1A1F2E',
          gray:         '#F8F9FB',
        },
        risk: {
          low:            '#D6EFC7',
          'low-text':     '#1E5C0A',
          medium:         '#FFF0C2',
          'medium-text':  '#7A4C00',
          high:           '#FFE0A0',
          'high-text':    '#6B3500',
          extreme:        '#FF2D2D',   // merah — universal risk warning
          'extreme-text': '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
