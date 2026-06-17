/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        'bg-soft': '#121622',
        surface: '#1a1d27',
        'surface-2': '#21263a',
        fg: '#e8eaf0',
        muted: '#8b92a8',
        faint: '#555b70',
        border: '#2e3348',
        accent: '#6c63ff',
        'accent-2': '#00d2a0',
        danger: '#ff5c6c',
        warning: '#ffb340',
      },
      fontFamily: {
        display: ['Be Vietnam Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        body: ['Be Vietnam Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
