import { each, includes, iterate, join, merge, push } from '../collect/index.js';
import { event as createEvent } from '../event/index.js';
import { isEqual, isObject } from '../is/index.js';
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
        has: {
          lang: false,
        },
        languages: [],
        mode: 1,
        fallback: undefined,
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

    let languages = options.languages;
    if (length(languages)) {
      languages = join('|', languages);
      options.has.lang = true;
    }

    let mode = options.mode;
    const fallback = options.fallback;

    each(route => {
      const newRoute = {
        name: route.name,
        path: route.path,
        regex: {},
        page: route.page,
        option: route.option,
        method: route.method,
        remount: route.remount,
        mode: route.mode,
      };

      const multi = isObject(route.path);
      const basePath = route.path == '/';
      const path = basePath ? '' : route.path;
      if (route.mode) mode = route.mode;

      if (!options.has.lang) {
        newRoute.regex.path = routeToRegExp(route.path);
      } else {
        if ((basePath || mode == 2 || mode == 3) && !multi) {
          newRoute.regex.path = routeToRegExp(route.path);
        }
        if (multi) {
          for (const lang in route.path) {
            if (mode == 2) newRoute.regex[fallback] = routeToRegExp(path[fallback]);
            if (mode == 3) {
              newRoute.regex[lang] = routeToRegExp(path[lang]);
            }
            if (mode == 3) {
              newRoute.regex[lang + '$'] = routeToRegExp(`/${lang}` + path[lang]);
            }
          }
        } else {
          if (languages) newRoute.regex.lang = routeToRegExp(`(${languages})` + path);
        }
      }

      push(newRoute, routes);
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
    const { store, redirect } = this;
    let x = e.target.closest('a');
    let y = x && x.getAttribute('href');
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) {
      return;
    }
    if (!y || x.target || x.host !== location.host || y[0] == '#') return;
    if (y[0] != '/' || store.options.regex.test(y)) {
      e.preventDefault();
      redirect.call(this, y);
    }
  }
  redirect(uri, replace) {
    const store = this.store;
    const { options } = store;
    if (uri[0] == '/' && !options.regex.test(uri)) uri = options.base + uri;
    history[(uri === store.current || replace ? 'replace' : 'push') + 'State'](uri, null, uri);
  }
  async run() {
    const { event, store, redirect } = this;
    const uri = getUri();
    const pathname = getPathname(uri || location.pathname, store);
    let match;
    if (pathname) {
      const { routes, options } = store;
      store.current = pathname;
      const hasLang = options.has.lang;
      let lang = options.fallback;
      const route = await iterate(
        async i => {
          const route = routes[i];
          if (hasLang) {
            for (const part in route.regex) {
              match = route.regex[part].pattern.exec(pathname);
              if (match) {
                if (includes(match[1], options.languages)) {
                  lang = match[1];
                } else {
                  const key = part.replace('$', '');
                  if (includes(key, options.languages)) {
                    lang = key;
                  }
                }
                return route;
              }
            }
          } else {
            match = route.regex.path.pattern.exec(pathname);
            if (match) return route;
          }
        },
        true,
        length(routes)
      );

      let load = true;
      if (store.route && isEqual(store.route.page, route.page) && !route.remount) {
        load = false;
      }
      if (load) event.emit('exit');
      const ctx = {
        option: undefined,
        page: undefined,
        redirect: redirect.bind(this),
        routerStore: store,
      };
      if (hasLang) ctx.language = lang;
      if (!route) {
        event.emit('enter', ctx);
        return false;
      }
      if (route.option) ctx.option = route.option;
      if (load) {
        if (route.page) ctx.page = await loadPage(route.page, ctx);
        event.emit('enter', ctx);
      } else {
        event.emit('update', ctx);
      }
      store.route = route;
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
    const { store } = this;
    uri = getUriSSR(uri);
    const pathname = getPathname(uri, store);
    let match;
    if (pathname) {
      const { routes, options } = store;
      store.current = pathname;
      const hasLang = options.has.lang;
      let lang = options.fallback;
      let route = await iterate(
        async i => {
          const route = routes[i];
          if (hasLang) {
            for (const part in route.regex) {
              match = route.regex[part].pattern.exec(pathname);
              if (match) {
                if (includes(match[1], options.languages)) {
                  lang = match[1];
                } else {
                  const key = part.replace('$', '');
                  if (includes(key, options.languages)) {
                    lang = key;
                  }
                }
                return route;
              }
            }
          } else {
            match = route.regex.path.pattern.exec(pathname);
            if (match) return route;
          }
        },
        true,
        length(routes)
      );
      const ctx = {
        option: undefined,
        page: undefined,
        routerStore: store,
      };
      if (hasLang) ctx.language = lang;
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
    const { store, method } = this;
    uri = getUriSSR(uri);
    const pathname = getPathname(uri, store);
    let match;
    if (pathname) {
      store.current = pathname;
      let routes = store.routes;
      let route = await iterate(
        async i => {
          const route = routes[i];
          match = route.regex.path.pattern.exec(pathname);
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
