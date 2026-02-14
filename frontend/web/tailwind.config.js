/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Strict Palette: "Black, White, Silver"
                silver: {
                    DEFAULT: 'var(--silver-300)',
                    50: 'var(--silver-50)',
                    100: 'var(--silver-100)',
                    200: 'var(--silver-200)',
                    300: 'var(--silver-300)',
                    400: 'var(--silver-400)',
                    500: 'var(--silver-500)',
                    600: 'var(--silver-600)',
                    700: 'var(--silver-700)',
                    800: 'var(--silver-800)',
                    900: 'var(--silver-900)',
                },
                // Background Layers - Mapped to CSS variables
                canvas: 'var(--canvas)', 
                panel: 'var(--panel)',  
                surface: 'var(--surface)', 
                white: '#FFFFFF',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // For Headings/Logo
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'silver-glow': '0 0 15px -3px rgba(192, 192, 192, 0.1)',
            },
            borderColor: {
                DEFAULT: '#333333',
            },
        },
    },
    plugins: [],
}
