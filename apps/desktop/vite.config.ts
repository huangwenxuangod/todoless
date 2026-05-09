import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  resolve: {
    alias: [
      {
        find: /^react$/,
        replacement: path.resolve(__dirname, "../../node_modules/react"),
      },
      {
        find: /^react\/(.*)$/,
        replacement: path.resolve(__dirname, "../../node_modules/react/$1"),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom"),
      },
      {
        find: /^react-dom\/(.*)$/,
        replacement: path.resolve(__dirname, "../../node_modules/react-dom/$1"),
      },
      {
        find: /^lucide-react$/,
        replacement: path.resolve(__dirname, "../../node_modules/lucide-react"),
      },
      {
        find: /^@todoless\/shared$/,
        replacement: path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
      {
        find: /^@todoless\/shared\/(.*)$/,
        replacement: path.resolve(__dirname, "../../packages/shared/src/$1"),
      },
    ],
    dedupe: ["react", "react-dom", "lucide-react"],
  },
});
