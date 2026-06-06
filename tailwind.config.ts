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
          blue:       '#0344D8',
          'blue-hover': '#387EE4',
          lime:       '#D1EA2C',
          amber:      '#FFC128',
          navy:       '#1A1F2E',
          gray:       '#F8F9FB',
        },
        // Risk classification colours (tints of brand palette)
        risk: {
          low:        '#D6EFC7',   // tint of lime
          'low-text': '#2D5A0E',
          medium:     '#FFF0C2',   // tint of amber
          'medium-text': '#7A4C00',
          high:       '#FFE0A0',   // deeper amber tint
          'high-text':'#6B3500',
          extreme:    '#0344D8',   // brand blue for extreme — stands out
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
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
