import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// DisCloud production configuration
const DISCLOUD_URL = 'https://brasilsimracing.discloud.app';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: process.env.NODE_ENV === 'production' ? './' : '/',
    server: {
      host: "0.0.0.0",
      port: Number(process.env.PORT || 8080),
      strictPort: false,
      // Allow both localhost (for development) and Discloud domain (for production)
      allowedHosts: ["brasilsimracing.discloud.app"],
    },
    build: {
      // Always output to `build` so we can commit the built files and
      // deploy to Discloud without requiring an on-server build.
      outDir: "build",
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
