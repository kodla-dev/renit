import { createServer } from 'vite';
import { getOptions, printUrls, setAppServer } from '../../utils.js';

/**
 * Starts the development server with the provided options.
 *
 * - Retrieves app-specific development options.
 * - Creates and starts a Vite development server.
 * - Prints the URLs for the running server.
 *
 * @async
 * @returns {Promise<void>}
 */
export default async function () {
  // Retrieve app, dev, and csr-specific options for the server.
  const options = await getOptions('app', 'dev', 'csr');

  // Create a Vite development server with the retrieved options.
  const app = await createServer(options.vite);

  setAppServer(app); // Set the global application server.
  await app.listen(); // Start the server and listen for incoming requests.
  printUrls(options); // Print the server's accessible URLs to the console.
}
