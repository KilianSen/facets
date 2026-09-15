/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Editorial neo-brutalism: cream paper, near-black ink, one coral accent. No glows, no gradients.
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: { DEFAULT: '#FAF7F2', deep: '#F0E9DE' },
        ink: { DEFAULT: '#151515', soft: '#55504B', faint: '#8C857E' },
        coral: { DEFAULT: '#FF5A36', deep: '#E5421E', soft: '#FFE2D9' },
      },
      boxShadow: {
        'hard-sm': '2px 2px 0 0 #151515',
        hard: '4px 4px 0 0 #151515',
        'hard-lg': '7px 7px 0 0 #151515',
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
}
