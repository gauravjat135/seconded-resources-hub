import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    tailwindcss(),
    tanstackStart(),

    ...(command === "build" ? [netlify()] : []),

    react(),
  ],
}));