import { loop, sort, split } from '../collect/index.js';
import { isFunction, isUndefined } from '../is/index.js';
import { length } from '../math/index.js';

/**
 * Converts a path segment to a numerical value based on specific patterns.
 *
 * @param {string} str - The path segment to convert.
 * @returns {number} - The numerical value representing the path segment's priority.
 */
function toValue(str) {
  if (str == '*') return 1e11; // Wildcard paths have the highest priority
  if (/^\:(.*)\?/.test(str)) return 1111; // Optional parameters have moderate priority
  if (/^\:(.*)\./.test(str)) return 11; // Parameters with dots have lower priority
  if (/^\:/.test(str)) return 111; // Regular parameters have low priority
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
    // Compare routes by their ranks and sort them
    return (
      (cache[b.path] = cache[b.path] || toRank(b.path)) -
      (cache[a.path] = cache[a.path] || toRank(a.path))
    );
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
  return uri.replace(/^.*\/\/[^\/]+/, '');
}

/**
 * Retrieves the pathname from a given URI.
 *
 * @param {string} uri - The input URI string.
 * @returns {string} - The pathname extracted from the URI.
 */
export function getPathname(uri, store) {
  if (!uri) return uri;
  const regex = store.options.regex;
  uri = '/' + uri.replace(/^\/|\/$/g, '');
  return (regex.test(uri) && uri.replace(regex, '/')).match(/[^\?#]*/)[0];
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
 * Retrieves and resolves a component based on the route and context provided.
 *
 * @param {Object} route - The route object containing information about the route.
 * @param {Object} context - The context object to store the resolved component.
 * @returns {Promise<number>} - A promise that resolves to 1 upon successful retrieval of the component.
 */
export function getComponent(route, context) {
  return new Promise(async resolve => {
    let comp = route.component;
    // If the component is a function, invoke it with route.meta
    isFunction(comp) && (comp = comp(route.meta));
    // Resolve the component, which might be a promise
    return Promise.resolve(comp).then(async component => {
      let error = 0;
      context.component = component.default || component;
      if (!error) {
        resolve(1);
      }
    });
  });
}
