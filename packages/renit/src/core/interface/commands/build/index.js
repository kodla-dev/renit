import { build } from 'vite';
import { clone } from '../../../../helpers/index.js';
import { color, indexJsPath } from '../../utils.js';

export default async function (options) {
  const outDir = clone(options.vite.build.outDir);
  if (options.param.csr) return csr(options, { outDir, manifest: false });
  await csr(options, { outDir, manifest: true });
  await ssr(options, { outDir });
}

async function csr(options, config) {
  try {
    if (config.manifest) options.vite.build.manifest = true;
    if (config.outDir) options.vite.build.outDir = config.outDir + '/client';
    await build(options.vite);
    if (options.clearScreen) console.clear();
    console.log(color.green('✓'), 'Build successful.');
  } catch (error) {
    console.log(color.red('✗'), 'Build failed.');
  }
}

async function ssr(options, config) {
  try {
    options.vite.build.ssr = indexJsPath;
    options.vite.build.outDir = config.outDir + '/server';
    options.vite.build.manifest = false;
    options.vite.build.minify = 'esbuild';
    await build(options.vite);
    if (options.clearScreen) console.clear();
    console.log(color.green('✓'), 'Build successful.');
  } catch (error) {
    console.log(error);
    console.log(color.red('✗'), 'Build failed.');
  }
}
