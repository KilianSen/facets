/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#08080c',
        accent: {
          DEFAULT: '#22d3ee', // cyan
          soft: '#67e8f9',
          alt: '#d946ef', // fuchsia
        },
      },
      borderRadius: {
        beam: '1.125rem', // ~18px
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 10px 50px -12px rgba(34,211,238,0.45)',
      },
      keyframes: {
        'beam-spin': { to: { transform: 'rotate(1turn)' } },
      },
      animation: {
        'beam-spin': 'beam-spin 4.5s linear infinite',
      },
    },
  },
  plugins: [],
}
