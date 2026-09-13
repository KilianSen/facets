/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        editorial: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#08080c',
        bone: '#FAF7F2',
        coral: {
          DEFAULT: '#FF5A36',
          hover: '#FF4119',
        },
        pop: {
          yellow: '#FFE500',
          pink: '#FF4D8D',
          cyan: '#00F0FF',
        },
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
