import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({mode})
  base: [ https://github.com/svetneyro83-dev/pill-pal-pro-54  ],
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
  },
  preview: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
