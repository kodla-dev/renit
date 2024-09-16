import { build } from 'vite';
import { getOptions, out } from '../../utils.js';

/**
 * Performs the Server-Side Rendering (SSR) build process.
 *
 * - Retrieves build options for SSR from the configuration.
 * - Attempts to build using the retrieved options.
 * - Logs success or failure of the build process.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  const options = await getOptions('app', 'build', 'ssr'); // Retrieve options for SSR build.
  try {
    await build(options.vite); // Perform the build process.
    out('SSR build successful.');
  } catch (error) {
    out.error('SSR build failed.', error); // Log error if build fails.
  }
}
