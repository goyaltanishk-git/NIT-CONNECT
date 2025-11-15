import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ⭐ ADD THIS BLOCK ⭐
  optimizeDeps: {
    include: [
      "three",
      "three/nodes",
      "@react-three/fiber",
      "@react-three/drei"
    ],
    exclude: [
      "three/examples/jsm/tsl/display/BloomNode.js"
    ],
  },
}));
