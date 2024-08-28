import { each, loop, merge, push } from '../collect/index.js';
import { event as createEvent } from '../event/index.js';
import { routeToRegExp } from '../to/index.js';
import { parseUri } from '../to/uri/index.js';
import {
  getComponent,
  getParams,
  getPathname,
  getUri,
  getUriSSR,
  routeSort,
  stateWrap,
} from './utils.js';

/**
 * Base Router class to manage routing and events.
 */
class Router {
  /**
   * Initializes a Router instance.
   *
   * @param {Array<Object>} Routes - Array of route objects with path, name, and component.
   * @param {Object} [Options={}] - Configuration options for the router.
   */
  constructor(Routes, Options = {}) {
    this.event = createEvent(); // Event manager
    this.store = {
      current: '',
      routes: [], // List of routes
      options: {
        base: '/',
        regex: /^\/+/,
      },
    };
    merge(Options, this.store.options); // Merge options with default settings

    const { options, routes } = this.store;
    let base = options.base;
    base = '/' + (base || '').replace(/^\/|\/$/g, ''); // Normalize base path
    let regex = options.regex;
    // Adjust regex for base path
    regex = base == '/' ? regex : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');
    options.regex = regex;

    each(route => {
      push(
        {
          name: route.name || route.path,
          path: route.path,
          regex: routeToRegExp(route.path), // Convert route path to regex
          meta: {
            path: null,
            pathname: null,
            param: {},
            hash: {},
            query: {},
          },
          state: {},
          component: route.component,
        },
        routes
      );
    }, Routes);

    this.store.routes = routeSort(routes); // Sort routes
  }

  /**
   * Registers an event listener.
   *
   * @param {string} event - The event name.
   * @param {Function} callback - The callback function for the event.
   */
  on(event, callback) {
    this.event.on(event, callback);
  }
}

/**
 * Client-side router class for handling navigation and route changes.
 */
export class ClientRouter extends Router {
  /**
   * Initializes a ClientRouter instance.
   *
   * @param {Array<Object>} Routes - Array of route objects.
   * @param {Object} [Options={}] - Configuration options for the router.
   */
  constructor(Routes, Options = {}) {
    super(Routes, Options);
  }

  /**
   * Starts listening for route changes and navigation events.
   */
  listen() {
    const run = this.run.bind(this);
    const click = this.click.bind(this);

    stateWrap('push'); // Wrap state changes for push
    stateWrap('replace'); // Wrap state changes for replace

    // Add event listeners for navigation
    addEventListener('popstate', run);
    addEventListener('replacestate', run);
    addEventListener('pushstate', run);
    addEventListener('click', click);

    run(); // Initial route handling
  }

  /**
   * Handles click events for navigation.
   *
   * @param {MouseEvent} e - The click event object.
   */
  click(e) {
    const { store, go } = this;
    let x = e.target.closest('a');
    let y = x && x.getAttribute('href');

    // Check for non-navigation clicks
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) {
      return;
    }

    if (!y || x.target || x.host !== location.host || y[0] == '#') return;
    if (y[0] != '/' || store.options.regex.test(y)) {
      e.preventDefault(); // Prevent default link behavior
      go.call(this, y); // Navigate programmatically
    }
  }

  /**
   * Programmatically navigates to a given URI.
   *
   * @param {string} uri - The URI to navigate to.
   * @param {boolean} [replace=false] - Whether to replace the current history entry.
   */
  go(uri, replace) {
    const store = this.store;
    const { options } = store;
    if (uri[0] == '/' && !options.regex.test(uri)) uri = options.base + uri;
    history[(uri === store.current || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
  }

  /**
   * Runs the route matching and component rendering.
   */
  run() {
    const { event, store } = this;
    event.emit('exit'); // Emit exit event
    const uri = getUri(); // Get the current URI
    const pathname = getPathname(uri || location.pathname, store); // Get pathname from URI
    let match;
    let route;
    let parse = {};
    let context = {};
    if (pathname) {
      store.current = pathname;
      let routes = store.routes;
      const routesEach = async i => {
        route = routes[i];
        match = route.regex.pattern.exec(pathname);
        if (match) {
          let meta = route.meta;
          meta.path = uri;
          meta.pathname = pathname;
          getParams(route, match)
            .then(params => (meta.param = params)) // Get route parameters
            .then(() => {
              parse = parseUri(uri); // Parse URI
              meta.query = parse.query;
              meta.hash = parse.hash;
              context = {
                meta: meta,
                component: null,
              };
            })
            .then(() => getComponent(route, context)) // Get route component
            .then(() => {
              event.emit('enter', context); // Emit enter event
            });
          return context;
        }
      };
      return loop(routesEach, routes); // Process routes
    }
    return false;
  }
}

/**
 * Server-side router class for handling server-side routing.
 */
export class ServerRouter extends Router {
  /**
   * Initializes a ServerRouter instance.
   *
   * @param {Array<Object>} Routes - Array of route objects.
   * @param {Object} [Options={}] - Configuration options for the router.
   */
  constructor(Routes, Options = {}) {
    super(Routes, Options); // Initialize base Router
  }

  /**
   * Runs the route matching and component rendering on the server.
   *
   * @param {string} [uri] - The URI to handle.
   * @returns {Promise<Object|boolean>} Resolves to the route context or `false` if no match.
   */
  async run(uri) {
    const { store } = this;

    return new Promise(resolve => {
      uri = getUriSSR(uri); // Get URI for server-side rendering
      const pathname = getPathname(uri, store); // Get pathname from URI
      let match;
      let route;
      let parse = {};
      let context = {};
      if (pathname) {
        store.current = pathname;
        let routes = store.routes;
        const routesEach = async i => {
          route = routes[i];
          match = route.regex.pattern.exec(pathname);
          if (match) {
            let meta = route.meta;
            meta.path = uri;
            meta.pathname = pathname;
            meta.param = await getParams(route, match); // Get route parameters
            parse = parseUri(uri); // Parse URI
            meta.query = parse.query;
            meta.hash = parse.hash;
            context = {
              meta: meta,
              component: null,
            };
            await getComponent(route, context); // Get route component
            resolve(context); // Resolve promise with context
            return context;
          }
        };
        return loop(routesEach, routes); // Process routes
      }
      resolve(false); // Resolve promise with false if no match
      return false;
    });
  }
}
