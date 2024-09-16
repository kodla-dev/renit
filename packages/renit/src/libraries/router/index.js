import { each, iterate, merge, push } from '../collect/index.js';
import { event as createEvent } from '../event/index.js';
import { isObject } from '../is/index.js';
import { length } from '../math/index.js';
import { routeToRegExp } from '../to/index.js';
import {
  fixUriProxy,
  getPathname,
  getUri,
  getUriSSR,
  load,
  loadPage,
  routeSort,
  stateWrap,
} from './utils.js';

/**
 * Handles routing logic.
 *
 * @class
 */
class Router {
  constructor(Routes, Options = {}) {
    this.store = {
      current: '',
      route: undefined,
      routes: [],
      options: {
        base: '/',
        regex: /^\/+/,
      },
    };
    // Initialize routing logic
    merge(Options, this.store.options);

    const { options, routes } = this.store;
    let base = options.base;
    base = '/' + (base || '').replace(/^\/|\/$/g, '');
    let regex = options.regex;
    regex = base == '/' ? regex : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');
    options.regex = regex;

    each(route => {
      push(
        {
          name: route.name || route.path,
          path: route.path,
          regex: routeToRegExp(route.path),
          page: route.page,
          option: route.option,
          method: route.method,
        },
        routes
      );
    }, Routes);

    this.store.routes = routeSort(routes);
  }
}

/**
 * Client-side router with event handling.
 *
 * @extends Router
 */
export class ClientRouter extends Router {
  constructor(Routes, Options = {}) {
    super(Routes, Options);
    this.event = createEvent();
  }
  on(event, callback) {
    this.event.on(event, callback);
  }
  async listen() {
    const run = this.run.bind(this);
    const click = this.click.bind(this);
    stateWrap('push');
    stateWrap('replace');
    addEventListener('popstate', run);
    addEventListener('replacestate', run);
    addEventListener('pushstate', run);
    addEventListener('click', click);
    await run();
  }
  click(e) {
    const { store, go } = this;
    let x = e.target.closest('a');
    let y = x && x.getAttribute('href');
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) {
      return;
    }
    if (!y || x.target || x.host !== location.host || y[0] == '#') return;
    if (y[0] != '/' || store.options.regex.test(y)) {
      e.preventDefault();
      go.call(this, y);
    }
  }
  go(uri, replace) {
    const store = this.store;
    const { options } = store;
    if (uri[0] == '/' && !options.regex.test(uri)) uri = options.base + uri;
    history[(uri === store.current || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
  }
  async run() {
    const { event, store } = this;
    event.emit('exit');

    const uri = getUri();
    const pathname = getPathname(uri || location.pathname, store);

    if (pathname) {
      store.current = pathname;
      let routes = store.routes;
      const route = await iterate(
        async i => {
          const route = routes[i];
          const match = route.regex.pattern.exec(pathname);
          if (match) return route;
        },
        true,
        length(routes)
      );
      const ctx = {
        option: undefined,
        page: undefined,
      };
      if (!route) {
        event.emit('enter', ctx);
        return false;
      }
      store.route = route;
      if (route.option) ctx.option = route.option;
      if (route.page) ctx.page = await loadPage(route.page, ctx);
      event.emit('enter', ctx);
    }
  }
}

/**
 * Server-side router for handling requests.
 *
 * @extends Router
 */
export class ServerRouter extends Router {
  constructor(Routes, Options = {}) {
    super(Routes, Options);
  }

  async run(uri) {
    const { event, store } = this;
    uri = getUriSSR(uri);
    const pathname = getPathname(uri, store);
    if (pathname) {
      store.current = pathname;
      let routes = store.routes;
      let route = await iterate(
        async i => {
          const route = routes[i];
          const match = route.regex.pattern.exec(pathname);
          if (match) return route;
        },
        true,
        length(routes)
      );
      const ctx = {
        option: undefined,
        page: undefined,
      };
      if (!route) return ctx;
      store.route = route;
      if (route.option) ctx.option = route.option;
      if (route.page) ctx.page = await loadPage(route.page, ctx);
      return ctx;
    }
  }
}

/**
 * API router for handling API routes.
 *
 * @extends Router
 */
export class ApiRouter extends Router {
  constructor(Routes, Options = {}) {
    super(Routes, Options);
    this.method = undefined;
  }

  async run(uri) {
    uri = fixUriProxy(uri);
    const { event, store, method } = this;
    uri = getUriSSR(uri);
    const pathname = getPathname(uri, store);
    if (pathname) {
      store.current = pathname;
      let routes = store.routes;
      let route = await iterate(
        async i => {
          const route = routes[i];
          const match = route.regex.pattern.exec(pathname);
          if (match) return route;
        },
        true,
        length(routes)
      );
      const ctx = {
        option: undefined,
        run: undefined,
      };
      if (!route) return ctx;
      store.route = route;
      if (route.option) ctx.option = route.option;

      if (isObject(route.method)) {
        if (route.method[method]) ctx.run = route.method[method];
      } else {
        const methodFns = await load(route.method);
        if (methodFns[method]) ctx.run = methodFns[method];
      }

      return ctx;
    }
  }

  setMethod(method) {
    this.method = method.toLowerCase();
  }
}
