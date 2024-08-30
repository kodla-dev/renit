import { createServer as createViteServer } from 'vite';
import { mergeDeep } from '../../../../libraries/collect/index.js';
import { createServer, sendType } from '../../../../libraries/server/index.js';
import { getIndexHtml, getIndexJs, indexCssPath, indexJsPath, printUrls } from '../../utils.js';

/**
 * Main function to execute the appropriate server setup based on options.
 *
 * @param {Object} options - Configuration options for server setup.
 * @returns {Promise<void>} Resolves when the server setup is complete.
 */
export default async function (options) {
  await api(options); // Start the API server
  if (options.param.csr) return csr(options); // Handle client-side rendering (CSR)
  return ssr(options); // Handle server-side rendering (SSR)
}

/**
 * Sets up and starts the API server.
 *
 * @param {Object} options - Configuration options for API server.
 * @returns {Promise<void>} Resolves when the API server is started.
 */
async function api(options) {
  const index = await getIndexJs(); // Get the index.js file
  const api = createServer(); // Create a new server instance
  api.use((req, res) => {
    sendType(res, 200, {
      success: 'success',
    });
  });
  api.listen(options.api.server.port); // Start the API server on the specified port
}

/**
 * Sets up and starts the Vite server for client-side rendering.
 *
 * @param {Object} options - Configuration options for Vite server.
 * @returns {Promise<void>} Resolves when the Vite server is started.
 */
async function csr(options) {
  const app = await createViteServer(options.vite); // Create a Vite server instance
  await app.listen(); // Start the Vite server
  printUrls(options.vite.server.port, options.api.server.port, 'CSR'); // Print URLs for CSR
}

/**
 * Sets up and starts the Vite server for server-side rendering.
 *
 * @param {Object} options - Configuration options for Vite server.
 * @returns {Promise<void>} Resolves when the SSR server setup is complete.
 */
async function ssr(options) {
  const app = createServer();

  // Merge Vite configuration with custom settings
  mergeDeep(
    {
      server: { middlewareMode: true },
      appType: 'custom',
    },
    options.vite
  );
  const vite = await createViteServer(options.vite); // Create a Vite server instance

  app.use(vite.middlewares, async (req, res, next) => {
    const url = req.originalUrl; // Get the requested URL
    const headers = req.headers; // Get request headers
    try {
      let template = getIndexHtml(); // Get the HTML template
      template = await vite.transformIndexHtml(url, template); // Transform the HTML with Vite
      await vite.ssrLoadModule(indexCssPath); // Load the CSS module
      const { default: render } = await vite.ssrLoadModule(indexJsPath); // Load the SSR module
      const respond = await render(url, headers, template); // Render the response
      sendType(res, respond.code, respond.data, respond.headers); // Send the HTML response
    } catch (error) {
      vite.ssrFixStacktrace(error); // Fix stack trace for SSR errors
      next(error); // Pass the error to the next middleware
    }
  });

  const port = options.app.server.port;

  app.listen(port, () => {
    printUrls(port, options.api.server.port, 'SSR + Hydration', true); // Print URLs for SSR
  });
}
