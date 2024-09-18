import { createServer as createDevServer } from 'vite';
import { createServer } from '../../../../libraries/server/index.js';
import { getOptions, indexJsPath, setApiServer } from '../../utils.js';

/**
 * Initializes and starts an API server with SSR support.
 *
 * - Retrieves API-specific options for the server.
 * - Creates a custom server instance.
 * - Creates a Vite development server.
 * - Sets the Vite server as the API server.
 * - Configures middleware to handle API requests.
 * - Starts the server and listens on the specified port.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  // Get API-specific options for the server.
  const options = await getOptions('api', 'dev', 'ssr');
  if (!options.api) return; // Exit if no API options are provided.
  const app = createServer(); // Create a custom server instance.
  const dev = await createDevServer(options.vite); // Create a Vite development server.
  setApiServer(dev); // Set the Vite server as the API server.

  // Use the Vite server's middlewares to handle API requests.
  app.use(dev.middlewares, async (req, res, next) => {
    try {
      const { default: run } = await dev.ssrLoadModule(indexJsPath());
      await run(req, res);
    } catch (error) {
      dev.ssrFixStacktrace(error);
      next(error);
    }
  });

  // Start the server and listen on the specified port.
  app.listen(options.api.server.port);
}
