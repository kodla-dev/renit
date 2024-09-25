/**
  Renit
  --------------------------------------------------------------------------------------------------
  The small framework with powerful features
  --------------------------------------------------------------------------------------------------
*/

import { RAW_EMPTY } from './core/define.js';
import config from './core/interface/config.js';
import { mount } from './core/runtime/index.js';
import { merge } from './libraries/collect/index.js';
import { ApiRouter, ClientRouter, ServerRouter } from './libraries/router/index.js';

/**
 * Initializes the application based on the environment (API, CSR, or SSR).
 *
 * @returns {Promise<void> | Object} - Returns a promise for SSR or an object for CSR.
 */
export function start() {
  if (import.meta.env.API) {
    // If API is enabled, use API mode
    return api();
  } else if (import.meta.env.SSR) {
    // If SSR is enabled, use Server-Side Rendering
    return ssr();
  } else {
    // Otherwise, use Client-Side Rendering
    csr();
  }
}

/**
 * API mode: returns the routes as is.
 *
 * @param {Array} routes - The application's route definitions.
 * @returns {Array} - The routes provided.
 */
function api() {
  const router = new ApiRouter(config.router.routes, { base: config.base });
  return async (req, res) => {
    config.setRequest(req);
    config.res = res;
    router.setMethod(req.method);
    config.init();

    const ctx = await router.run(config.url);
    merge(ctx, config);

    await config.enter();

    if (config.run) {
      await config.run(config);
    }
  };
}

/**
 * Client-Side Rendering (CSR) mode: sets up a router and mounts components.
 */
function csr() {
  const router = new ClientRouter(config.router.routes, {
    base: config.base,
    languages: config.i18n.languages,
    mode: config.router.url.mode,
    fallback: config.i18n.fallback,
  });
  let app;
  let target = config.router.target || document.body;

  config.init();

  // On entering a route, mount the page
  router.on('enter', async ctx => {
    merge(ctx, config);

    await config.enter();

    if (config.page) {
      app = await mount(target, config.page, config.option, true);
    } else {
      target.innerHTML = _404();
    }
  });

  router.on('update', async ctx => {
    merge(ctx, config);
    await config.enter();
    if (app) app.update();
  });

  // On exiting a route, destroy the page
  router.on('exit', () => {
    if (app) app.destroy();
  });

  // Start listening for route changes
  router.listen();
}

/**
 * Server-Side Rendering (SSR) mode: sets up a router and returns the component's DOM.
 */
function ssr() {
  const router = new ServerRouter(config.router.routes, {
    base: config.base,
    languages: config.i18n.languages,
    mode: config.router.url.mode,
    fallback: config.i18n.fallback,
  });

  const plant = (search, content, template) => template.replace(search, content);
  const content = (content, template) => plant('<!--app-->', content, template);

  return async (req, res, template) => {
    config.setRequest(req);
    config.res = res;

    config.init();

    const ctx = await router.run(config.url);
    merge(ctx, config);

    await config.enter();

    if (config.page) {
      let data = RAW_EMPTY;
      let head = RAW_EMPTY;
      const page = config.page();
      const results = page.option.results;
      const dom = page.dom;

      if (results.css.raw.length) {
        head += `<style type="text/css">${results.css.raw}</style>`;
        results.css.clear();
      }
      if (dom.length) data += dom;
      template = template.replace('</head>', head + '</head>');
      data = content(data, template);
      data = plant('lang=""', `lang="${config.i18n.language}"`, data);
      config.html(data, 200);
    } else {
      config.html(content(_404(), template), 404);
    }
  };
}

/**
 * Returns a 404 error page HTML string.
 *
 * @returns {string} The HTML for the 404 error page.
 */
function _404() {
  return `<h1>404</h1><p>This page could not be found.</p>`;
}
