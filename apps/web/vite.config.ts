import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** 개발 서버가 /api와 /ws를 미들웨어로 넘겨 브라우저가 같은 출처로 부른다. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const middlewareUrl = env.MIDDLEWARE_URL ?? "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: middlewareUrl,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ws": { target: middlewareUrl, ws: true },
      },
    },
  };
});
