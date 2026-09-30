import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // In dev the panel talks to the backend through this proxy, so the browser
  // sees one origin: no CORS setup needed and auth cookies stick to localhost.
  const target = env.VITE_API_PROXY_TARGET || "https://api.bilimtrack.kg";
  const proxy = { target, changeOrigin: true, secure: true };
  // Absolute origin for og:image / og:url in index.html (link previews need a full URL).
  process.env.VITE_PUBLIC_URL = (env.VITE_PUBLIC_URL || "https://ops.bilimtrack.kg").replace(/\/$/, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: { "/api": proxy, "/health": proxy },
    },
    // Unit tests cover pure logic only (no DOM): files `*.test.ts` next to the code.
    test: { include: ["src/**/*.test.ts"], environment: "node" },
  };
});
