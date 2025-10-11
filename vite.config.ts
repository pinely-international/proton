import path from "path"
import { defineConfig } from "vite"
import viteCompression from "vite-plugin-compression"
import { externalizeDeps } from "vite-plugin-externalize-deps"

import jsxCompressPlugin from "./vite-plugin-jsx-compress"


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    externalizeDeps({ peerDeps: true }),
    jsxCompressPlugin(),
    viteCompression({
      algorithm: "brotliCompress", 
      threshold: 10240,           
      deleteOriginFile: false
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: false,
    outDir: "build",
    // Minification is set to 'esbuild' for production for smaller bundles, but disabled in development for easier debugging of JSX attribute names and identifiers.
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: true,
    emptyOutDir: true,
    modulePreload: false,

    lib: {
      entry: [
        path.resolve(__dirname, "./src/index.ts"),
        path.resolve(__dirname, "./src/jsx/jsx-runtime.ts"),
        path.resolve(__dirname, "./src/jsx/ProtonJSX.ts"),
        path.resolve(__dirname, "./src/utils/WebNodeBinding.ts"),
      ],
      formats: ["es"]
    }
  },
  esbuild: {
    treeShaking: true,
    minifyIdentifiers: false,
    keepNames: false 
  },
}))