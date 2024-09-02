import { preview } from 'vite';
import { printUrls } from '../../utils.js';

export default async function (options) {
  if (options.param.csr) return csr(options);
}

async function csr(options) {
  await preview(options.vite);
  printUrls(
    options.vite.preview.port,
    options.api.server.port,
    options.clearScreen,
    'CSR + Preview'
  );
}
