import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import fg from 'fast-glob';
import dts from 'vite-plugin-dts';

const entryPoints = ['source/is/index.ts'];
const files = fg.sync(entryPoints, { absolute: true });

const entities = files.map((file) => {
  let keyWithoutExt = '';
  const [key] = file.match(/(?<=source\/).*$/) || [];
  if (typeof key != 'undefined') {
    keyWithoutExt = key.replace(/\.[^.]*$/, '');
  }
  return [keyWithoutExt, file];
});

const entry = Object.fromEntries(entities);

export default defineConfig({
  resolve: {
    alias: {
      renit: resolve(__dirname, './source')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    lib: {
      name: 'renit',
      entry: entry,
      formats: ['cjs', 'es']
    },
    rollupOptions: {
      output: {
        preserveModules: true
      }
    }
  },
  plugins: [dts()],
  test: {
    include: ['test/**/*.{test,spec}.{js,ts}'],
    environmentMatchGlobs: [
      ['test/**/*.client.{test,spec}.{js,ts}', 'happy-dom']
    ]
  }
});
