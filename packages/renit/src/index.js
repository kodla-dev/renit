/**
  Renit
  --------------------------------------------------------------------------------------------------
  The small framework with powerful features
  --------------------------------------------------------------------------------------------------
*/

import { mount } from './core/runtime/index.js';
import { ClientRouter, ServerRouter } from './libraries/router/index.js';

/**
 * Initializes the application based on the environment (API, CSR, or SSR).
 *
 * @param {Array} routes - The application's route definitions.
 * @returns {Promise<void> | Object} - Returns a promise for SSR or an object for CSR.
 */
export function start(routes) {
  if (!import.meta.env) {
    // If no environment variables are set, use API mode
    return api(routes);
  } else if (import.meta.env.SSR) {
    // If SSR is enabled, use Server-Side Rendering
    return ssr(routes);
  } else {
    // Otherwise, use Client-Side Rendering
    csr(routes);
  }
}

/**
 * API mode: returns the routes as is.
 *
 * @param {Array} routes - The application's route definitions.
 * @returns {Array} - The routes provided.
 */
function api(routes) {
  return routes;
}

/**
 * Client-Side Rendering (CSR) mode: sets up a router and mounts components.
 *
 * @param {Array} routes - The application's route definitions.
 */
function csr(routes) {
  const router = new ClientRouter(routes);
  let app;

  // On entering a route, mount the component
  router.on('enter', ctx => {
    app = mount(document.body, ctx.component);
  });

  // On exiting a route, destroy the component
  router.on('exit', () => {
    if (app) app.destroy();
  });

  // Start listening for route changes
  router.listen();
}

/**
 * Server-Side Rendering (SSR) mode: sets up a router and returns the component's DOM.
 *
 * @param {Array} routes - The application's route definitions.
 * @returns {Function} - A function that takes a URL and returns an object with the component's DOM.
 */
function ssr(routes) {
  const router = new ServerRouter(routes);
  return async url => {
    const ctx = await router.run(url);
    const component = ctx.component();
    return {
      body: component.dom,
    };
  };
}
