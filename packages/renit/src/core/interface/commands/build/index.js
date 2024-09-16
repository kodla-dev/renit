import api from './api.js';
import csr from './csr.js';
import ssr from './ssr.js';

/**
 * Runs the build process based on the provided arguments.
 *
 * - Initializes API and CSR (Client-Side Rendering) processes.
 * - Conditionally runs CSR based on the command line arguments.
 * - Always runs SSR (Server-Side Rendering) after CSR.
 *
 * @async
 * @param {string[]} args - Command line arguments.
 * @returns {Promise<void>}
 */
export default async function (args) {
  await api(); // Run API build process.

  // Conditionally run CSR based on the provided arguments.
  if (args[1] == '--csr') return await csr();

  // Always run CSR before SSR.
  await csr();
  await ssr();
}
