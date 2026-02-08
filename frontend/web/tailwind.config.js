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
                    DEFAULT: '#C0C0C0',
                    50: '#F5F5F5',
                    100: '#E5E5E5',
                    200: '#D4D4D4',
                    300: '#A3A3A3',
                    400: '#737373',
                    500: '#525252',
                    600: '#404040',
                    700: '#262626',
                    800: '#171717',
                    900: '#0A0A0A',
                },
                // Background Layers - Softened Dark Mode (Light Black / Dark Grey)
                canvas: '#0F0F0F', // Rich dark grey, not pure black
                panel: '#1A1A1A',  // Lighter grey for cards
                surface: '#262626', // Interactive surface
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
