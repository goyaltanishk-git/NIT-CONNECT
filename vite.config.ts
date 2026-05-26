import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      "/api": {
        target: "https://portfoliotrial-omega.vercel.app",
        changeOrigin: true,
        secure: false,
      },
    },
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // Sentry source map upload — only runs during production build
    // Needs SENTRY_AUTH_TOKEN env var set (in .env or Vercel env vars)
    mode === "production" && sentryVitePlugin({
      org:      "rishul",
      project:  "kraken-connect",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        // Upload source maps then delete them so they're not public
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
    }),
  ].filter(Boolean),

  build: {
    // Required: generate source maps for Sentry to read
    sourcemap: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  optimizeDeps: {
    include: [
      "three",
      "three/nodes",
      "@react-three/fiber",
      "@react-three/drei",
    ],
    exclude: [
      "three/examples/jsm/tsl/display/BloomNode.js",
    ],
  },
}));
