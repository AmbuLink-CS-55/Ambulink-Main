import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ReactCompilerConfig = {};
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    // dashboard dependencies should share the root React copy.
    dedupe: ["react", "react-dom", "scheduler"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("maplibre-gl")) return "vendor-map";
          if (id.includes("@tanstack")) return "vendor-tanstack";
          if (id.includes("lucide-react") || id.includes("@hugeicons")) return "vendor-icons";
          if (id.includes("@base-ui")) return "vendor-base-ui";
          return "vendor";
        },
      },
    },
  },
});
