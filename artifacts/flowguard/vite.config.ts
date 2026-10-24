import path from 'path';
import { cpSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const frontendRoot = path.resolve(import.meta.dirname, 'source/frontend');
const outputRoot = path.resolve(import.meta.dirname, 'dist/public');
const htmlPages = Object.fromEntries(
  readdirSync(frontendRoot)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace(/\.html$/, ''), path.resolve(frontendRoot, file)]),
);

export default defineConfig({
  base: basePath,
  plugins: [
    runtimeErrorOverlay(),
    {
      name: 'copy-classic-frontend-scripts',
      apply: 'build',
      closeBundle() {
        cpSync(path.resolve(frontendRoot, 'js'), path.resolve(outputRoot, 'js'), {
          recursive: true,
        });
      },
    },
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
  },
  root: frontendRoot,
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    rollupOptions: {
      input: htmlPages,
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
