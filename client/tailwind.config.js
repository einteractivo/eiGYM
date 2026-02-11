/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gym: {
                    primary: '#ff3e00', // Energetic orange/red
                    dark: '#1a1a1a',
                    light: '#ffffff',
                    accent: '#00ffcc', // Cyan neon
                }
            }
        },
    },
    plugins: [],
}
