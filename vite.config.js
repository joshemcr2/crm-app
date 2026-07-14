import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.jsx"],
            refresh: true,
        }),
        react(),
    ],
    // Forzamos a Vite a usar rutas relativas seguras en producción
    base: './',
    server: {
        cors: true,
        hmr: {
            protocol: 'wss', // Forzar WebSockets Seguros
        },
    },
});