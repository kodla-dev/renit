import { pipe } from '../../../helpers/index.js';
import {
  entries,
  filter,
  includes,
  join,
  map,
  prepend,
  push,
  reduce,
  shift,
  split,
} from '../../collect/index.js';
import { isArray, isNil, isRegExp, isString } from '../../is/index.js';
import { length } from '../../math/index.js';
import { sub } from '../../string/index.js';

const routeRgx = /(\/|^)([:*][^/]*?)(\?)?(?=[/.]|$)/g;
const uriRgx =
  /^(?:([^:\/?#]+):\/\/)?((?:([^\/?#@]*)@)?([^\/?#:]*)(?:\:(\d*))?)?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n)*))?/i;

/**
 * Parses a string based on specific delimiters and returns an object representation.
 * @param {string} str The input string to parse.
 * @param {string} first The initial character to trim from the string.
 * @param {string} middle The delimiter to split key-value pairs.
 * @returns {Object} An object representing the parsed key-value pairs.
 */
function parse(str, first, middle) {
  return pipe(
    str,
    // Trim the first character if it matches the specified `first` character.
    str => (str.charAt(0) === first ? str.slice(1) : str),
    // Split the string into key-value pairs using the `middle` delimiter.
    split(middle),
    // Split each pair into [key, value] arrays.
    map(p => split('=', p)),
    // Reduce the array of pairs into an object with keys and values.
    reduce([
      (r, p) => {
        const name = p[0];
        if (!name) return r;
        let value = length(p) > 1 ? p[length(p) - 1] : true;
        if (isString(value) && includes(',', value)) value = split(',', value);
        isNil(r[name]) ? (r[name] = [value]) : push(value, r[name]);
        return r;
      },
      {},
    ]),
    // Convert object entries to [key, value] pairs and reduce to final object.
    entries(),
    reduce([
      (r, p) => ((r[p[0]] = length(p[1]) > 1 ? p[1] : p[1][0]), r),
      {},
    ])
  );
}

/**
 * Parses a URL query string into an object representation.
 * @param {string} str The query string to parse.
 * @returns {Object} An object representing the parsed key-value pairs.
 */
export function parseQuery(str) {
  return parse(str, '?', '&');
}

/**
 * Converts a hash string into an object representation.
 * @param {string} str The hash string to convert.
 * @returns {Object} An object representation of the hash string.
 */
export function parseHash(str) {
  return parse(str, '#', '|');
}

/**
 * Converts a JavaScript object into a formatted string based on specified delimiters.
 * @param {Object} obj The object to convert.
 * @param {string} first The initial character to prepend to the string.
 * @param {string} middle The delimiter to use between key-value pairs.
 * @returns {string} A formatted string representing the object.
 */
function make(obj, first, middle) {
  return pipe(
    obj,
    // Map over object entries to construct key-value pair strings.
    map((value, name) => {
      if (!value) return null;
      if (value === true) return name;
      return `${name}=${isArray(value) ? join(',', value) : value}`;
    }),
    // Filter out null entries.
    filter(),
    // Join all entries into a single string separated by `middle`.
    join(middle),
    // Prepend the `first` character to the final string.
    prepend(first)
  );
}

/**
 * Converts a JavaScript object into a URL query string.
 * @param {Object} obj The object to convert.
 * @returns {string} A URL query string representing the object.
 */
export function makeQuery(obj) {
  return make(obj, '?', '&');
}

/**
 * Converts a JavaScript object into a hash string.
 * @param {Object} obj The object to convert.
 * @returns {string} A hash string representing the object.
 */
export function makeHash(obj) {
  return make(obj, '#', '|');
}

/**
 * Converts a path string into a regular expression pattern and extracts parameter keys.
 * @param {string|RegExp} path The route path to convert.
 * @param {boolean} [loose=false] Whether to allow loose matching at the end.
 * @returns {{ keys: Array, pattern: RegExp }} An object containing keys and the RegExp pattern.
 */
export function routeToRegExp(path, loose = false) {
  // Return immediately if path is already a RegExp.
  if (isRegExp(path)) return { keys: false, pattern: path };

  const keys = [];
  let pattern = '';
  const arr = split('/', path);

  // Remove the first empty string if the path starts with a slash.
  if (!arr[0]) shift(arr);

  // Iterate through each segment of the path.
  for (const segment of arr) {
    const c = segment[0];

    if (c === '*') {
      // Handle wildcard '*' by capturing any path segment.
      push('wild', keys);
      pattern += '/(.*)';
    } else if (c === ':') {
      // Handle named parameters ':param' or ':param?' with optional parts.
      const o = segment.indexOf('?', 1);
      const ext = segment.indexOf('.', 1);
      const end = o !== -1 ? o : ext !== -1 ? ext : length(segment);

      push(segment.slice(1, end), keys);
      pattern += o !== -1 && ext === -1 ? '(?:/([^/]+?))?' : '/([^/]+?)';

      if (ext !== -1) {
        pattern += (o !== -1 ? '?' : '') + '\\' + segment.slice(ext);
      }
    } else {
      // Handle static path segments.
      pattern += '/' + segment;
    }
  }

  const regexpPattern = new RegExp(`^${pattern}${loose ? '(?=$|/)' : '/?$'}`, 'i');

  return { keys, pattern: regexpPattern };
}

/**
 * Converts a route pattern and values into a URL path.
 * @param {string} route The route pattern with placeholders.
 * @param {Object} values An object with values to replace placeholders in the route.
 * @returns {string} The resulting URL path.
 */
export function routeToPath(route, values) {
  return route.replace(routeRgx, (x, lead, key, optional) => {
    x = values[key == '*' ? 'wild' : sub(1, key)];
    return x ? '/' + x : optional || key == '*' ? '' : '/' + key;
  });
}

export function parseUri(uri) {
  const parts = uri.match(uriRgx);
  const auth = (parts[3] || '').split(':');
  const host = length(auth) ? (parts[2] || '').replace(/(.*\@)/, '') : parts[2];
  return {
    uri: parts[0],
    protocol: parts[1],
    host: host,
    hostname: parts[4],
    port: parts[5],
    auth: parts[3],
    user: auth[0],
    password: auth[1],
    path: parts[6],
    query: parts[7],
    hash: parts[8],
  };
}
