import { loop, sort, split, values } from '../collect/index.js';
import { isFunction, isObject, isUndefined } from '../is/index.js';
import { length } from '../math/index.js';

/**
 * Converts a path segment to a numerical value based on specific patterns.
 *
 * @param {string} str - The path segment to convert.
 * @returns {number} - The numerical value representing the path segment's priority.
 */
function toValue(str) {
  if (str == '*') return 1e11; // Wildcard paths have the highest priority
  if (/^:(.*)\?/.test(str)) return 1111; // Optional parameters have moderate priority
  if (/^:(.*)\./.test(str)) return 11; // Parameters with dots have lower priority
  if (/^:/.test(str)) return 111; // Regular parameters have low priority
  return 1; // Static segments have the lowest priority
}

/**
 * Computes the rank of a path by evaluating its segments' values.
 *
 * @param {string} str - The route path to evaluate.
 * @returns {number} - The rank of the path based on its segments' values.
 */
function toRank(str) {
  let i = 0;
  let out = '';
  const arr = split('/', str); // Split the path into segments by '/'
  for (; i < length(arr); i++) {
    out += toValue(arr[i]); // Convert each segment to its value and concatenate
  }
  return (i - 1) / +out; // Calculate the rank based on the concatenated values
}

/**
 * Sorts an array of routes based on their ranks.
 *
 * @param {Array} routes - The routes to be sorted.
 * @returns {Array} - The sorted routes.
 */
export function routeSort(routes) {
  let cache = {};

  routes = sort((a, b) => {
    a = a.path;
    b = b.path;
    if (isObject(a)) a = values(a)[0];
    if (isObject(b)) b = values(b)[0];
    // Compare routes by their ranks and sort them
    return (cache[b] = cache[b] || toRank(b)) - (cache[a] = cache[a] || toRank(a));
  }, routes);

  return routes;
}

/**
 * Wraps a history state method with a custom implementation.
 *
 * @param {string} type - The type of history state method to wrap.
 * @param {Function} fn - The original function to be wrapped.
 */
export function stateWrap(type, fn) {
  if (history[type]) return; // Check if the method is already wrapped
  history[type] = type; // Store the type in the history object

  // Append 'State' to the type to get the method name
  fn = history[(type += 'State')];

  // Override the original method
  history[type] = function (uri) {
    var ev = new Event(type.toLowerCase()); // Create a new event with the method name
    ev.uri = uri; // Attach the URI to the event
    fn.apply(this, arguments); // Call the original function with all arguments
    return dispatchEvent(ev); // Dispatch the event
  };
}

/**
 * Retrieves the URI from a given input or defaults to the current location.
 *
 * @param {Object|string} uri - The input URI object or string.
 * @returns {string} - The processed URI string.
 */
export function getUri(uri) {
  if (isUndefined(uri) || isUndefined(uri.uri)) {
    uri = location.href;
  } else {
    uri = uri.uri;
  }

  return getUriSSR(uri);
}

/**
 * Processes a URI for server-side rendering by stripping the protocol and host.
 *
 * @param {string} uri - The URI to process.
 * @returns {string} - The URI without the protocol and host.
 */
export function getUriSSR(uri) {
  return uri.replace(/^.*\/\/[^/]+/, '');
}

/**
 * Retrieves the pathname from a given URI.
 *
 * @param {string} uri - The input URI string.
 * @returns {string} - The pathname extracted from the URI.
 */
export function getPathname(uri, store) {
  if (!uri) return uri;
  const { regex } = store.options;
  uri = '/' + uri.replace(/^\/|\/$/g, '');
  if (regex.test(uri)) uri = uri.replace(regex, '/');
  return uri.match(/[^?#]*/)[0];
}

/**
 * Fixes the given URI by adjusting proxy and double slashes.
 *
 * @param {string} uri - The URI to fix.
 * @returns {string} The corrected URI.
 */
export function fixUriProxy(uri) {
  const proxy = '/api';
  if (uri.startsWith(proxy)) uri = uri.replace(proxy, '/');
  if (uri.startsWith('//')) uri = uri.replace('//', '/');
  return uri;
}

/**
 * Extracts parameters from a matched route using the route's regular expression.
 *
 * @param {Object} route - The route object containing a `regex` property with the keys.
 * @param {Array} match - The array of matched values from the route's regular expression.
 * @returns {Promise<Object>} A promise that resolves to an object containing the extracted parameters.
 */
export async function getParams(route, match) {
  return new Promise(resolve => {
    let params = {};

    loop(i => {
      params[route.regex.keys[i]] = match[++i] || null;
    }, route.regex.keys);

    resolve(params);
  });
}

/**
 * Loads a function or value asynchronously.
 *
 * @param {Function|any} fn - The function or value to load.
 * @returns {Promise<any>} A promise that resolves with the loaded value.
 */
export function load(fn) {
  return new Promise(resolve => {
    isFunction(fn) && (fn = fn());
    return Promise.resolve(fn).then(fn => {
      resolve(fn);
    });
  });
}

/**
 * Loads a page component asynchronously, resolving it with the provided context.
 *
 * @param {Function|any} component - The page component to load.
 * @param {Object} ctx - The context for the component.
 * @returns {Promise<any>} A promise that resolves with the loaded component.
 */
export function loadPage(component, ctx) {
  return new Promise(resolve => {
    isFunction(component) && (component = component(ctx));
    return Promise.resolve(component).then(component => {
      component = component.default || component;
      resolve(component);
    });
  });
}
