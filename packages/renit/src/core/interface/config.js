import { includes, iterate, merge } from '../../libraries/collect/index.js';
import { isString } from '../../libraries/is/index.js';
import { length } from '../../libraries/math/index.js';
import { sendType } from '../../libraries/server/utils.js';
import { pickLanguage } from './language.js';

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
    user: undefined,
  };
}

/**
 * Main configuration object for the application.
 * Handles both SSR and CSR configurations.
 * @type {Object}
 */
const config = {
  base: '/', // Base URL for the application.
  baseUrl: undefined,
  charset: 'utf-8', // Default charset for responses.
  router: routerConfig(), // Router configuration.
  i18n: i18nConfig(), // Internationalization configuration
};

if (client) {
  if (!config.baseUrl) config.baseUrl = location.origin;

  /**
   * Initializes `config` by setting `hash` and configuring language.
   */
  config.init = () => {
    config.hash = includes('#', config.base);
    solveLanguage(config, navigator.language || navigator.userLanguage);
  };

  /**
   * Checks if the current path starts with the base URL and redirects if not.
   * Resolves after checking.
   *
   * @returns {Promise<void>}
   */
  config.enter = async () => {
    return new Promise(resolve => {
      if (!config.hash) {
        const pathname = location.pathname;
        if (!pathname.startsWith(config.base)) {
          const path = pathname == '/' ? '' : pathname;
          config.redirect(config.base + path, true);
        }
      }
      config.i18n.language = config.language;
      resolve();
    });
  };
}

if (api) {
  config.init = () => {
    if (includes('#', config.base)) throw "Hash-based routing doesn't work on the api.";
  };
  config.enter = async req => {
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
  config.init = () => {
    if (includes('#', config.base)) throw "Hash-based routing doesn't work on the server.";
    solveLanguage(config, config.req.headers['accept-language']);
  };

  /**
   * Handles redirection if the current URL path does not start with the base URL.
   *
   * @param {Object} req - The request object.
   * @returns {Promise<void>} A promise that resolves after checking and possibly redirecting.
   */
  config.enter = async req => {
    return new Promise(resolve => {
      const pathname = config.url;
      if (!pathname.startsWith(config.base)) {
        const path = pathname == '/' ? '' : pathname;
        config.redirect(config.base + path);
      }
      config.i18n.language = config.language;
      resolve();
    });
  };
}

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

    if (!config.baseUrl) {
      const host = req.headers.host;
      const protocol = getProtocol(req);
      config.baseUrl = protocol + '://' + host;
    }
  };

  /**
   * Sends a 302 redirect response to the specified URI.
   *
   * @param {string} uri - The URI to redirect to.
   */
  config.redirect = uri => {
    config.res.writeHead(302, {
      Location: uri,
    });
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
 * @param {Object} config - Configuration object containing i18n settings.
 * @param {string} accept - Accepted languages string (e.g., from "Accept-Language" header).
 */
function solveLanguage(config, accept) {
  const { fallback, languages } = config.i18n;
  const hasLanguages = length(languages);
  if (hasLanguages || fallback) {
    if (!config.i18n.user) {
      // Try to pick a language from the accepted languages
      let lang = pickLanguage(languages, accept);
      if (!lang) lang = pickLanguage(languages, accept, { loose: true });
      if (!lang) lang = fallback ? fallback : languages[0]; // Fallback to default language
      config.i18n.user = lang;
    }
    // Initialize default language if not already set
    if (!fallback) config.i18n.fallback = languages[0];
  }
}

const links = new Map();

const p = a => a.split('/').filter(b => b);

function _link(path) {
  if (links.has(path)) return links.get(path);

  const { base, baseUrl, router, routerStore } = config;
  const { link, url } = router;
  const { mode } = url;

  const newPath = [];
  const hasLang = config.language;
  const { language, fallback } = config.i18n;

  if (link.baseUrl) newPath.push(baseUrl);
  if (base != '/') newPath.push(...p(base));

  if (!path || path == '/') {
    if (hasLang) newPath.push(language);
    return newPath.join('/');
  }

  if (hasLang) {
    const { routes } = routerStore;
    if (mode == 1) path = '/' + fallback + (path.startsWith('/') ? path : '/' + path);
    iterate(
      i => {
        const route = routes[i];
        for (const part in route.regex) {
          const match = route.regex[part].pattern.exec(path);
          if (match) {
            if (isString(route.path)) {
              newPath.push(...p(path));
            } else {
              let lng = language;
              if (mode == 1 || mode) lng = lng + '$';
              if (mode == 3 && includes('$', part)) lng + '$';
              const { keys } = route.regex[lng];
              let params = {};
              for (let i = 0; i < length(keys); ) {
                params[keys[i]] = match[++i] || null;
              }
              let convert = route.path[language].replace(
                /(\/|^)([:*][^/]*?)(\?)?(?=[/.]|$)/g,
                (x, l, k, o) => {
                  x = params[k == '*' ? k : k.substring(1)];
                  return x ? '/' + x : o || k == '*' ? '' : '/' + k;
                }
              );
              if (mode == 1 || (mode == 2 && fallback != language)) {
                convert = '/' + language + convert;
              }
              newPath.push(...p(convert));
            }
            return route;
          }
        }
      },
      true,
      length(routes)
    );
  } else {
    newPath.push(...p(path));
  }

  let newLink = newPath.join('/');
  if (hasLang) path = language + path;
  links.set(path, newLink);
  return newLink;
}

export const link = _link, l = _link, $l = _link; // prettier-ignore
export default config;
