import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    minify: "esbuild",
    sourcemap: mode === "development" ? "inline" : false,
  },
  server: {
    host: "localhost",
    port: 5173,
  },
  envPrefix: "VITE_",
}));