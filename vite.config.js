import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendProxyTarget = env.VITE_BACKEND_PROXY_TARGET || "http://localhost:3000";
  const isCatalystBuild = mode === "catalyst";

  return {
    plugins: [react()],
    base: "./",
    build: {
      outDir: isCatalystBuild ? "../backend new/client" : "dist",
      emptyOutDir: !isCatalystBuild
    },
    server: {
      proxy: {
        "/server/backend": {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
