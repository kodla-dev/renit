import api from './api.js';
import csr from './csr.js';
import ssr from './ssr.js';

/**
 * Initializes the Vite development environment based on the provided arguments.
 *
 * @param {Array} args - Command-line arguments to determine the mode (CSR/SSR).
 *
 * - `--csr`: If this flag is passed as the second argument, the CSR mode will be initialized.
 * - Otherwise, the SSR mode will be initialized.
 */
export default async function (args) {
  // Initialize API-related configurations or middleware.
  await api();

  // Check if CSR (Client-Side Rendering) is explicitly requested.
  if (args[1] == '--csr') return await csr();

  // If CSR is not requested, initialize SSR (Server-Side Rendering) mode by default.
  await ssr();
}
