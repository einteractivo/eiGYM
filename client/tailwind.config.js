/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
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
                    sidebar: '#000000',
                    'sidebar-hover': '#1a1a1a',
                    'nav-start': '#ff4c42',
                    'nav-end': '#ff8c26',
                    'body-bg': '#f8f9fa',
                    'card-bg': '#ffffff',
                    'card-border': '#f1f5f9',
                    'text-sidebar': '#1e293b',
                    'text-dim': '#64748b'
                }
            }
        },
    },
    plugins: [],
}
