import { build } from 'vite';
import { getOptions, out } from '../../utils.js';

/**
 * Performs the Client-Side Rendering (CSR) build process.
 *
 * - Retrieves build options for CSR from the configuration.
 * - Attempts to build using the retrieved options.
 * - Logs success or failure of the build process.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  const options = await getOptions('app', 'build', 'csr'); // Retrieve options for CSR build.
  try {
    await build(options.vite); // Perform the build process.
    out('CSR build successful.');
  } catch (error) {
    out.error('CSR build failed.', error); // Log error if build fails.
  }
}
