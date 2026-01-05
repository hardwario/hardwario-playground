import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';
import fs from 'fs';

// Ensure dist-electron has CommonJS package.json
const ensureDistElectronPkgJson = () => ({
  name: 'ensure-dist-electron-pkg-json',
  writeBundle() {
    const dir = resolve(__dirname, 'dist-electron');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolve(dir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
  },
});

export default defineConfig({
  // Configure esbuild to treat .js files as JSX
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    // Exclude old .js files that have been replaced by .tsx
    exclude: ['reactstrap', 'prop-types'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          plugins: [ensureDistElectronPkgJson()],
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'serialport',
                'node-red',
                'aedes',
                'mqtt',
                '@serialport/bindings-cpp',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/render/components'),
      '@hooks': resolve(__dirname, 'src/render/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
