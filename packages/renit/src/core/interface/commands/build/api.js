import { build } from 'vite';
import { getOptions, out } from '../../utils.js';

/**
 * Performs the Server-Side Rendering (SSR) build process for the API.
 *
 * - Retrieves build options for API from the configuration.
 * - Checks if API options are available before proceeding.
 * - Attempts to build using the retrieved options.
 * - Logs success or failure of the build process.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  const options = await getOptions('api', 'build', 'ssr'); // Retrieve options for API SSR build.
  if (!options.api) return; // Exit if API options are not available.
  try {
    await build(options.vite); // Perform the build process.
    out('API build successful.');
  } catch (error) {
    out.error('API build failed.', error); // Log error if build fails.
  }
}
