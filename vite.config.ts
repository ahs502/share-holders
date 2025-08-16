import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** @see https://vite.dev/config/ */
export default defineConfig({
  base: "/share-holders/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Share Holders",
        short_name: "Share Holders",
        description:
          "A simple share holders preservation application that syncs with Dropbox.",
        theme_color: "#feffbc",
        icons: [
          {
            src: "coins-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
