import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite development configuration for the TravelBuddy frontend.
 *
 * In production, FastAPI serves the built bundle from its /static mount so no
 * proxy is needed.  During development, the Vite dev server runs on :5173 and
 * forwards API routes (/chat, /tts, /health) to the local FastAPI backend on
 * :8000 to avoid CORS complexity.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/chat":   { target: "http://localhost:8000", changeOrigin: true },
      "/tts":    { target: "http://localhost:8000", changeOrigin: true },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
