import { createServer as createDevServer } from 'vite';
import { createServer } from '../../../../libraries/server/index.js';
import {
  getIndexHtml,
  getOptions,
  indexCssPath,
  indexJsPath,
  printUrls,
  setAppServer,
} from '../../utils.js';

/**
 * Initializes and starts a development server for SSR (Server-Side Rendering).
 *
 * - Retrieves SSR-specific options for the server.
 * - Creates a Vite development server.
 * - Sets up middleware to handle SSR requests.
 * - Starts the server and prints the server's URLs.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  const options = await getOptions('app', 'dev', 'ssr'); // Get SSR-specific options for the server.
  const app = createServer(); // Create a custom server instance.
  const dev = await createDevServer(options.vite); // Create a Vite development server.
  setAppServer(dev); // Set the Vite server as the app server.

  // Use the Vite server's middlewares for handling SSR requests.
  app.use(dev.middlewares, async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = getIndexHtml(); // Get and transform the index HTML template.
      template = await dev.transformIndexHtml(url, template);

      // Load and apply the CSS and JS for the given URL.
      await dev.ssrLoadModule(indexCssPath());
      const { default: run } = await dev.ssrLoadModule(indexJsPath());
      await run(req, res, template);
    } catch (error) {
      // Fix stack trace and pass the error to the next middleware.
      dev.ssrFixStacktrace(error);
      next(error);
    }
  });

  // Start the server and print the URLs to the console.
  app.listen(options.app.server.port, () => {
    printUrls(options);
  });
}
