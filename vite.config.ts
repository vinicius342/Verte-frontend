import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/icon-512.png"],
      manifest: {
        name: "Verte",
        short_name: "Verte",
        description: "Clientes e endereços da equipe de campo.",
        lang: "pt-BR",
        display: "standalone",
        start_url: "/",
        theme_color: "#0f6f6e",
        background_color: "#eef1ec",
        icons: [
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        globIgnores: ["firebase-messaging-sw.js"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { outDir: "dist" },
});
