import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: "http://localhost:3000",
              changeOrigin: true,
            },
            "/message/send": {
              target: "http://localhost:3000",
              changeOrigin: true,
              rewrite: () => "/",
              timeout: 120000,
              proxyTimeout: 120000,
            },
            "/message/stream": {
              target: "http://localhost:3000",
              changeOrigin: true,
              rewrite: () => "/",
            },
          }
        : undefined,
  },
}));
