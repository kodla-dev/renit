/**
  Renit
  --------------------------------------------------------------------------------------------------
  The small framework with powerful features
  --------------------------------------------------------------------------------------------------
*/

import { RAW_EMPTY } from './core/define.js';
import { mount } from './core/runtime/index.js';
import { pipe } from './helpers/index.js';
import {
  dot,
  filter,
  includes,
  iterate,
  map,
  merge,
  some,
  sort,
  split,
  walk,
} from './libraries/collect/index.js';
import { isArray, isFunction, isObject, isString } from './libraries/is/index.js';
import { length } from './libraries/math/index.js';
import { ApiRouter, ClientRouter, ServerRouter } from './libraries/router/index.js';
import { sendType } from './libraries/server/utils.js';
import { lower, supplant } from './libraries/string/index.js';
import { routeToPath } from './libraries/to/index.js';

/**
 * Environment variables for the application.
 * These values are injected by Vite at build time.
 */
export const api = import.meta.env.API;
export const app = import.meta.env.APP;
export const server = import.meta.env.SERVER && import.meta.env.SSR;
export const client = import.meta.env.CLIENT || !import.meta.env.SSR;
export const development = import.meta.env.DEV;
export const production = !import.meta.env.DEV;
export const ssr = import.meta.env.SSR;
export const csr = !import.meta.env.SSR;

/**
 * Main configuration object for the application.
 * Handles both SSR and CSR configurations.
 * @type {Object}
 */
const kit = {
  base: '/', // Base URL for the application.
  baseUrl: undefined,
  charset: 'utf-8', // Default charset for responses.
  router: routerConfig(), // Router configuration.
  i18n: i18nConfig(), // Internationalization configuration
};

/**
 * Router configuration for the application.
 * @returns {Object} Router configuration object.
 */
function routerConfig() {
  return {
    routes: [], // Array of defined routes.
    target: undefined, // Target dom.
    url: {
      mode: 1, // Router mode
    },
    link: {
      baseUrl: false,
    },
  };
}

/**
 * Returns the default i18n configuration object.
 *
 * @returns {Object} The i18n config with default values.
 * @property {undefined} language - Current language.
 * @property {undefined} fallback - Initialization data.
 * @property {Array} languages - Supported languages.
 * @property {undefined} user - User language.
 */
function i18nConfig() {
  return {
    language: undefined,
    languages: [],
    fallback: undefined,
    fallbacks: undefined,
    user: undefined,
    files: undefined,
    async load(name) {
      let files = kit.i18n.files[name];
      if (!files || isObject(files)) return;
      if (isFunction(files)) files = files();
      let lang = {};
      if (isArray(files)) {
        await walk(async file => {
          file = await file;
          lang = Object.assign(lang, file.default);
        }, files);
      } else {
        files = await files;
        files = files.default;
        lang = files;
      }
      kit.i18n.files[name] = lang;
    },
  };
}

if (app) {
  kit.loader = async () => {
    const { i18n } = kit;
    const { load, language, fallback, fallbacks } = i18n;
    await load(fallback);
    await load(language);
    if (fallbacks && fallbacks[language]) {
      await load(fallbacks[language]);
    }
  };
}

if (client) {
  if (!kit.baseUrl) kit.baseUrl = location.origin;

  /**
   * Initializes `kit` by setting `hash` and configuring language.
   */
  kit.init = () => {
    kit.hash = includes('#', kit.base);
    solveLanguage(kit, navigator.language || navigator.userLanguage);
  };

  /**
   * Checks if the current path starts with the base URL and redirects if not.
   * Resolves after checking.
   *
   * @returns {Promise<void>}
   */
  kit.enter = async () => {
    return new Promise(resolve => {
      if (!kit.hash) {
        const pathname = location.pathname;
        if (!pathname.startsWith(kit.base)) {
          const path = pathname == '/' ? '' : pathname;
          kit.redirect(kit.base + path, true);
        }
      }

      if (kit.i18n.language != kit.language) {
        document.documentElement.lang = kit.language;
      }
      kit.i18n.language = kit.language;

      kit.loader().then(() => {
        resolve();
      });
    });
  };
}

if (api) {
  kit.init = () => {
    if (includes('#', kit.base)) throw "Hash-based routing doesn't work on the api.";
  };
  kit.enter = async () => {
    return new Promise(resolve => {
      resolve();
    });
  };
}

if (server) {
  /**
   * Initializes the config by checking for hash-based routing and setting the language.
   * Throws an error if hash-based routing is detected.
   */
  kit.init = () => {
    if (includes('#', kit.base)) throw "Hash-based routing doesn't work on the server.";
    solveLanguage(kit, kit.req.headers['accept-language']);
  };

  /**
   * Handles redirection if the current URL path does not start with the base URL.
   *
   * @param {Object} req - The request object.
   * @returns {Promise<void>} A promise that resolves after checking and possibly redirecting.
   */
  kit.enter = async () => {
    return new Promise(resolve => {
      const pathname = kit.url;
      if (!pathname.startsWith(kit.base)) {
        const path = pathname == '/' ? '' : pathname;
        kit.redirect(kit.base + path);
      }
      kit.i18n.language = kit.language;
      kit.loader().then(() => {
        resolve();
      });
    });
  };
}

if (ssr) {
  kit.req = undefined; // Incoming request object (for SSR).
  kit.res = undefined; // Outgoing response object (for SSR).
  kit.url = undefined; // URL of the incoming request.
  kit.status = 200; // Default HTTP status code.

  /**
   * Sets the request object for SSR.
   * @param {Object} req - The request object.
   */
  kit.setRequest = req => {
    kit.req = req;
    kit.url = req.originalUrl;

    if (!kit.baseUrl) {
      const host = req.headers.host;
      const protocol = getProtocol(req);
      kit.baseUrl = protocol + '://' + host;
    }
  };

  /**
   * Sends a 302 redirect response to the specified URI.
   *
   * @param {string} uri - The URI to redirect to.
   */
  kit.redirect = uri => {
    kit.res.writeHead(302, {
      Location: uri,
    });
  };

  /**
   * Sends HTML content as the response.
   * @param {string} content - HTML content to be sent.
   * @param {number} code - HTTP status code.
   * @param {Object} headers - Additional HTTP headers.
   * @param {string} [charset] - Charset of the response, defaults to kit.charset.
   */
  kit.html = (content, code, headers = {}, charset) => {
    if (!charset) charset = kit.charset;
    merge({ 'Content-Type': 'text/html' }, headers);
    sendType(kit.res, code, content, headers, charset);
    kit.factory();
  };

  /**
   * Sends plain content as the response.
   * @param {string} content - Content to be sent.
   * @param {number} [code] - HTTP status code, defaults to kit.status.
   * @param {Object} headers - Additional HTTP headers.
   * @param {string} [charset] - Charset of the response, defaults to kit.charset.
   */
  kit.send = (content, code, headers = {}, charset) => {
    if (!code) code = kit.status;
    if (!charset) charset = kit.charset;
    sendType(kit.res, code, content, headers, charset);
    kit.factory();
  };

  /**
   * Resets the configuration to default values for the next request.
   */
  kit.factory = () => {
    kit.status = 200;
    kit.charset = 'utf-8';
  };
}

/**
 * Gets the protocol from the request.
 *
 * @param {Object} req - The request object.
 * @returns {string} The protocol ('http' or 'https').
 */
function getProtocol(req) {
  var proto = req.socket.encrypted ? 'https' : 'http';
  proto = req.headers['x-forwarded-proto'] || proto;
  return proto.split(/\s*,\s*/)[0];
}

/**
 * Determines and sets the user's preferred language based on the provided configuration
 * and accepted languages.
 *
 * @param {Object} kit - Configuration object containing i18n settings.
 * @param {string} accept - Accepted languages string (e.g., from "Accept-Language" header).
 */
function solveLanguage(kit, accept) {
  const { fallback, languages } = kit.i18n;
  const hasLanguages = length(languages);
  if (hasLanguages || fallback) {
    if (!kit.i18n.user) {
      // Try to pick a language from the accepted languages
      let lang = pickLanguage(languages, accept);
      if (!lang) lang = pickLanguage(languages, accept, { loose: true });
      if (!lang) lang = fallback ? fallback : languages[0]; // Fallback to default language
      kit.i18n.user = lang;
    }
    // Initialize default language if not already set
    if (!fallback) kit.i18n.fallback = languages[0];
  }
}

/**
 * Parses the "Accept-Language" string into an array of language objects.
 *
 * @param {string} acceptLanguages - Accepted languages string.
 * @returns {Array<Object>} Parsed language objects sorted by quality.
 */
function languagesParser(acceptLanguages) {
  return pipe(
    acceptLanguages || '',
    split(','),
    map(item => {
      const [lang, qValue] = split(';q=', item);
      const [code, region, script] = split('-', lang.trim());
      return {
        code,
        region: region || null,
        script: script || null,
        quality: qValue ? parseFloat(qValue) : 1.0,
      };
    }),
    filter(item => item.code),
    sort((a, b) => b.quality - a.quality)
  );
}

/**
 * Selects the best matching language from supported ones.
 *
 * @param {Array<string>} supportedLanguages - Supported languages.
 * @param {string} acceptLanguage - Accepted language string.
 * @param {Object} [options={}] - Matching options.
 * @param {boolean} [options.loose=false] - Allow partial matches.
 * @returns {string|null} Best matching language or null.
 */
function pickLanguage(supportedLanguages, acceptLanguage, options = {}) {
  if (!length(supportedLanguages) || !acceptLanguage) return null;
  acceptLanguage = languagesParser(acceptLanguage);
  const supported = map(lang => {
    const [code, region, script] = split('-', lang);
    return { code, region: region || null, script: script || null };
  }, supportedLanguages);
  for (let i = 0; i < length(acceptLanguage); i++) {
    const lang = acceptLanguage[i];
    const langCode = lower(lang.code);
    const langRegion = lang.region ? lower(lang.region) : lang.region;
    const langScript = lang.script ? lower(lang.script) : lang.script;
    for (let j = 0; j < length(supported); j++) {
      const supportedCode = lower(supported[j].code);
      const supportedScript = supported[j].script
        ? lower(supported[j].script)
        : supported[j].script;
      const supportedRegion = supported[j].region
        ? lower(supported[j].region)
        : supported[j].region;
      if (
        langCode === supportedCode &&
        (options.loose || !langScript || langScript === supportedScript) &&
        (options.loose || !langRegion || langRegion === supportedRegion)
      ) {
        return supportedLanguages[j];
      }
    }
  }
}

// Links cache
const links = new Map();

// Path split
const pathSplit = a => a.split('/').filter(b => b);

/**
 * Generates a new link based on the provided path and configuration settings.
 * Caches the result for future calls with the same path.
 *
 * @returns {string} The generated link with optional language and base URL handling.
 */
export function link(key, params = {}, lang) {
  let name, path; // prettier-ignore
  if (!key.startsWith('/')) name = key;
  else path = key;

  const newPath = [];

  const { router, base, baseUrl, routerStore, i18n } = kit;
  const hasLang = kit.language;
  const { link, url } = router;
  let { mode } = url;
  const { routes } = routerStore;
  let { language, fallback, fallbacks } = i18n;

  if (fallbacks && fallbacks[language]) fallback = fallbacks[language];

  if (link.baseUrl) newPath.push(baseUrl);
  if (base != '/') newPath.push(...pathSplit(base));
  if (lang) language = lang;

  if (!key || path == '/') {
    if (hasLang) newPath.push(language);
    return newPath.join('/');
  }

  if (name) {
    const cKey = language + key + JSON.stringify(params);
    if (links.has(cKey)) return links.get(cKey);

    const route = routes.find(route => route.name == name);
    if (route.mode) mode = route.mode;
    if (isString(route.path)) path = route.path;
    else {
      if (route.path[language]) path = route.path[language];
      else {
        language = fallback;
        path = route.path[language];
      }
    }
    path = routeToPath(path, params);
    path = path.substring(1);
    if (!path) {
      if (hasLang) newPath.push(language);
    } else {
      if (hasLang && (mode == 1 || (mode == 2 && fallback != language))) newPath.push(language);
      newPath.push(path);
    }
  } else {
    const cKey = language + key;
    if (links.has(cKey)) return links.get(cKey);

    if (hasLang) {
      if (mode == 1) path = '/' + fallback + (path.startsWith('/') ? path : '/' + path);
      iterate(
        i => {
          const route = routes[i];
          for (const part in route.regex) {
            const match = route.regex[part].pattern.exec(path);
            if (match) {
              if (isString(route.path)) return newPath.push(...pathSplit(path));
              const findRegex = lng => {
                if (mode == 1 || mode) lng = lng + '$';
                if (mode == 3 && includes('$', part)) lng + '$';
                return route.regex[lng];
              };
              let regex = findRegex(language);
              if (!regex) {
                language = fallback;
                regex = findRegex(language);
              }
              const { keys } = regex;
              for (let i = 0; i < length(keys); ) {
                params[keys[i]] = match[++i] || null;
              }
              let convert = routeToPath(route.path[language], params);
              if (mode == 1 || (mode == 2 && fallback != language)) {
                convert = '/' + language + convert;
              }
              newPath.push(...pathSplit(convert));
              return;
            }
          }
        },
        true,
        length(routes)
      );
    } else {
      newPath.push(...pathSplit(path));
    }
  }

  let newLink = newPath.join('/');
  if (!link.baseUrl) newLink = '/' + newLink;

  if (name) {
    key = language + key + JSON.stringify(params);
  } else {
    key = language + key;
  }

  links.set(key, newLink);
  return newLink;
}

/**
 * Translates a key using the provided language and parameters.
 *
 * @param {string} key - The key for the translation string.
 * @param {Object} params - Parameters to replace in the translation string.
 * @param {string} lang - The language to use for translation.
 * @returns {string|Function} - The translated string or function result.
 */
export function translate(key, params, lang) {
  const { i18n } = kit;
  let { language, files, fallback, fallbacks } = i18n;
  if (lang) language = lang;
  let tree = files[language];
  if (!tree) {
    if (fallbacks && fallbacks[language]) tree = files[fallbacks[language]];
    else tree = files[fallback];
  }
  let val = dot(tree, key, '');
  if (!val) {
    if (fallbacks && fallbacks[language]) tree = files[fallbacks[language]];
    else tree = files[fallback];
    val = dot(tree, key, '');
  }
  if (isString(val)) return supplant(val, params, tree);
  if (isFunction(val)) return val(params);
  return val;
}

/**
 * Loads the specified language into the i18n configuration.
 *
 * @param {string} lang - The language code to load.
 * @returns {Promise<void>} - A promise that resolves when the language is loaded.
 */
export async function loadLanguage(lang) {
  await kit.i18n.load(lang);
}

/**
 * Checks if the current route is active.
 *
 * @param {string|string[]} name - The route name or array of names to check.
 * @param {boolean} [starts=false] - If true, checks if the current route starts with the given name(s).
 * @returns {boolean} - True if the current route matches the name or condition.
 */
export function active(name, starts = false) {
  const current = kit.routerStore.route.name;
  if (isArray(name)) {
    if (starts) return some(n => current.startsWith(n), name);
    return includes(current, name);
  }
  if (starts) return current.startsWith(name);
  return current == name;
}

/**
 * Checks for updates.
 * If the returned object changes, all components will be updated.
 *
 * @returns {Object} - The current language configuration.
 */
export function check() {
  return {
    l: kit.i18n.language,
    c: kit.routerStore.current,
  };
}

/**
 * Initializes the application based on the environment (API, CSR, or SSR).
 *
 * @returns {Promise<void> | Object} - Returns a promise for SSR or an object for CSR.
 */
export function init() {
  if (import.meta.env.API) {
    // If API is enabled, use API mode
    return initAPI();
  } else if (import.meta.env.SSR) {
    // If SSR is enabled, use Server-Side Rendering
    return initSSR();
  } else {
    // Otherwise, use Client-Side Rendering
    initCSR();
  }
}

/**
 * API mode: returns the routes as is.
 *
 * @param {Array} routes - The application's route definitions.
 * @returns {Array} - The routes provided.
 */
function initAPI() {
  const router = new ApiRouter(kit.router.routes, { base: kit.base });
  return async (req, res) => {
    kit.setRequest(req);
    kit.res = res;
    router.setMethod(req.method);
    kit.init();

    const ctx = await router.run(kit.url);
    merge(ctx, kit);

    await kit.enter();

    if (kit.run) {
      await kit.run(kit);
    }
  };
}

/**
 * Server-Side Rendering (SSR) mode: sets up a router and returns the component's DOM.
 */
function initSSR() {
  const router = new ServerRouter(kit.router.routes, {
    base: kit.base,
    languages: kit.i18n.languages,
    mode: kit.router.url.mode,
    fallback: kit.i18n.fallback,
  });

  const plant = (search, content, template) => template.replace(search, content);
  const content = (content, template) => plant('<!--app-->', content, template);

  return async (req, res, template) => {
    kit.setRequest(req);
    kit.res = res;

    kit.init();

    const ctx = await router.run(kit.url);
    merge(ctx, kit);

    await kit.enter();

    if (kit.page) {
      let data = RAW_EMPTY;
      let head = RAW_EMPTY;
      const page = kit.page();
      const results = page.option.results;
      const dom = page.dom;

      if (results.css.raw.length) {
        head += `<style type="text/css">${results.css.raw}</style>`;
        results.css.clear();
      }
      if (dom.length) data += dom;
      template = template.replace('</head>', head + '</head>');
      data = content(data, template);
      data = plant('lang=""', `lang="${kit.i18n.language}"`, data);
      kit.html(data, 200);
    } else {
      kit.html(content(_404(), template), 404);
    }
  };
}

/**
 * Client-Side Rendering (CSR) mode: sets up a router and mounts components.
 */
function initCSR() {
  const router = new ClientRouter(kit.router.routes, {
    base: kit.base,
    languages: kit.i18n.languages,
    mode: kit.router.url.mode,
    fallback: kit.i18n.fallback,
  });
  let app;
  let target = kit.router.target || document.body;

  kit.init();

  // On entering a route, mount the page
  router.on('enter', async ctx => {
    merge(ctx, kit);

    await kit.enter();

    if (kit.page) {
      app = await mount(target, kit.page, kit.option, true);
    } else {
      target.innerHTML = _404();
    }
  });

  router.on('update', async ctx => {
    merge(ctx, kit);
    await kit.enter();
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
 * Returns a 404 error page HTML string.
 *
 * @returns {string} The HTML for the 404 error page.
 */
function _404() {
  return `<h1>404</h1><p>This page could not be found.</p>`;
}

export default kit;
