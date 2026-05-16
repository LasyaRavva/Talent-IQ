import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const normalizeProxyTarget = (apiUrl) => {
  if (!apiUrl) return "http://localhost:3000";

  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const frontendDir = __dirname;
  const rootDir = path.resolve(__dirname, "..");
  const sharedEnv = loadEnv(mode, rootDir, "");
  const frontendEnv = loadEnv(mode, frontendDir, "");
  const env = { ...sharedEnv, ...frontendEnv };

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  const defineEnvEntries = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
  );

  return {
    plugins: [react(), tailwindcss()],
    define: defineEnvEntries,
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: normalizeProxyTarget(env.VITE_API_URL),
          changeOrigin: true,
        },
      },
    },
  };
});
