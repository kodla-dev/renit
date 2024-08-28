import { createServer as createViteServer } from 'vite';
import { mergeDeep } from '../../../../libraries/collect/index.js';
import { createServer, sendType } from '../../../../libraries/server/index.js';
import { getIndexHtml, getIndexJs, indexJsPath, printUrls } from '../../utils.js';

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

let styles = [];

/**
 * Updates or adds CSS style content for server-side rendering.
 *
 * @param {string} name - The name of the style.
 * @param {Object} content - The CSS content.
 */
export function ssrStyle(name, content) {
  if (!styles[name]) {
    styles[name] = content; // Add new style
  } else {
    styles[name].code = content.code; // Update existing style
  }
}

/**
 * Clears all stored CSS styles.
 */
export const clearStyle = () => (styles = []);

/**
 * Generates the HTML `<head>` section with all CSS styles.
 *
 * @returns {Promise<string>} A promise that resolves to the HTML head section.
 */
export async function getHead() {
  return new Promise(resolve => {
    let head = '';
    for (let style in styles) {
      style = styles[style];
      head += `<style type="text/css" data-vite-dev-id="${style.name}">${style.code}</style>`;
    }
    resolve(head); // Resolve with the generated head section
  });
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
      const { default: render } = await vite.ssrLoadModule(indexJsPath); // Load the SSR module
      const respond = await render(url, headers, template); // Render the response
      const head = await getHead(); // Get the head section with CSS
      template = template.replace(`<renit-head />`, head); // Insert CSS styles into the template
      const html = template.replace(`<renit-app />`, respond.body); // Insert rendered content into the template
      sendType(res, 200, html, { 'Content-Type': 'text/html' }); // Send the HTML response
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
