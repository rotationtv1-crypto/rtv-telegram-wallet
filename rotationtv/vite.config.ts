import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    outDir: "dist",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
