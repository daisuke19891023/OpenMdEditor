/// <reference types="vitest" />
/// <reference types="vite/client" />

import path from 'path'; // Node.js path module for resolving aliases
import { defineConfig } from 'vite';
// React plugin for Vite
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React plugin: Enables React Fast Refresh (HMR) and JSX transform
    react(),
  ],
  // Path alias configuration: Allows using '@/' for 'src/'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Development server configuration
  server: {
    port: 5173, // Default development port
    open: true, // Automatically open browser on server start (optional)
    // Proxy settings (Uncomment if NOT using 'vercel dev' and need to proxy API requests)
    // proxy: {
    //   // Proxy requests starting with '/api' to a different backend server
    //   '/api': {
    //     target: 'http://localhost:3001', // URL of your separate backend/API server
    //     changeOrigin: true, // Needed for virtual hosted sites
    //     // rewrite: (path) => path.replace(/^\/api/, ''), // Remove '/api' prefix if backend doesn't expect it
    //   },
    // },
  },
  // Build configuration
  build: {
    outDir: 'dist', // Output directory for production build
    sourcemap: true, // Generate source maps for production build (optional, aids debugging)
    // Rollup options for advanced customization (optional)
    // rollupOptions: {
    //   output: {
    //     manualChunks(id) {
    //       // Example: Put large vendor libraries into separate chunks
    //       if (id.includes('node_modules')) {
    //         // return id.toString().split('node_modules/')[1].split('/')[0].toString();
    //       }
    //     }
    //   }
    // }
  },
  // Vitest configuration (integrated testing framework)
  test: {
    // Enable global test variables (describe, it, expect, etc.)
    globals: true,
    // Set the test environment (jsdom simulates a browser DOM)
    environment: 'jsdom',
    // File(s) to run before each test file (e.g., for setting up Jest DOM matchers)
    setupFiles: './src/setupTests.ts',
    // Enable processing of CSS files imported in components during tests
    css: true,
    // Test coverage configuration
    coverage: {
      enabled: true, // Enable coverage collection
      provider: 'v8', // Use V8's built-in coverage capabilities (or 'istanbul')
      // Reporters for outputting coverage information
      reporter: ['text', 'json-summary', 'json', 'html'],
      // Files to include in coverage analysis
      include: ['src/**/*.{ts,tsx}'],
      // Files/patterns to exclude from coverage analysis
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**', // Exclude generated Shadcn UI components
        'src/components/providers/**', // Exclude providers
        'src/types/**', // Exclude type definition files
        '**/*.test.{ts,tsx}', // Exclude test files themselves
        'src/setupTests.ts', // Exclude test setup file
        'api/**', // Exclude API routes (tested separately if needed)
      ],
      // Thresholds for coverage enforcement (optional)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
});
