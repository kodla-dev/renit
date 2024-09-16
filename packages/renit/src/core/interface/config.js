import { merge } from '../../libraries/collect/index.js';
import { sendType } from '../../libraries/server/utils.js';

/**
 * Environment variables for the application.
 * These values are injected by Vite at build time.
 */
export const api = import.meta.env.API;
export const app = import.meta.env.APP;
export const server = import.meta.env.SERVER;
export const client = import.meta.env.CLIENT;
export const dev = import.meta.env.DEV;
export const ssr = import.meta.env.SSR;

/**
 * Router configuration for the application.
 * @returns {Object} Router configuration object.
 */
function router() {
  return {
    routes: [], // Array of defined routes.
    target: undefined, // Target dom.
  };
}

/**
 * Main configuration object for the application.
 * Handles both SSR and CSR configurations.
 * @type {Object}
 */
const config = {
  base: '/', // Base URL for the application.
  charset: 'utf-8', // Default charset for responses.
  router: router(), // Router configuration.
};

if (ssr) {
  config.req = undefined; // Incoming request object (for SSR).
  config.res = undefined; // Outgoing response object (for SSR).
  config.url = undefined; // URL of the incoming request.
  config.status = 200; // Default HTTP status code.

  /**
   * Sets the request object for SSR.
   * @param {Object} req - The request object.
   */
  config.setRequest = req => {
    config.req = req;
    config.url = req.originalUrl;
  };

  /**
   * Sends HTML content as the response.
   * @param {string} content - HTML content to be sent.
   * @param {number} code - HTTP status code.
   * @param {Object} headers - Additional HTTP headers.
   * @param {string} [charset] - Charset of the response, defaults to config.charset.
   */
  config.html = (content, code, headers = {}, charset) => {
    if (!charset) charset = config.charset;
    merge({ 'Content-Type': 'text/html' }, headers);
    sendType(config.res, code, content, headers, charset);
    config.factory();
  };

  /**
   * Sends plain content as the response.
   * @param {string} content - Content to be sent.
   * @param {number} [code] - HTTP status code, defaults to config.status.
   * @param {Object} headers - Additional HTTP headers.
   * @param {string} [charset] - Charset of the response, defaults to config.charset.
   */
  config.send = (content, code, headers = {}, charset) => {
    if (!code) code = config.status;
    if (!charset) charset = config.charset;
    sendType(config.res, code, content, headers, charset);
    config.factory();
  };

  /**
   * Resets the configuration to default values for the next request.
   */
  config.factory = () => {
    config.status = 200;
    config.charset = 'utf-8';
  };
}

export default config;
