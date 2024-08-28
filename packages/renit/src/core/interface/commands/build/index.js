import { build } from 'vite';
import { color } from '../../utils.js';

export default async function (options) {
  if (options.param.csr) return csr(options);
}

async function csr(options) {
  try {
    await build(options.vite);
    console.clear();
    console.log(color.green('✓'), 'Build successful.');
  } catch (error) {
    console.log(color.red('✗'), 'Build failed.');
  }
}
