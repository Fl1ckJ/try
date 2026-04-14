import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  cacheDir: path.resolve(__dirname, ".cache/vite"),
  plugins: [vue(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, "../static/dist"),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/main.ts"),
    },
  },
});
