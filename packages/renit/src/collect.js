import { DEVELOPMENT } from './define.js';
import { Renit } from './fault.js';
import { isObject, isPromise, isUndefined } from './is.js';

/**
 * Returns an array containing the keys of the specified object.
 *
 * @param {Object|Promise} [collect] - The object to extract keys from.
 * @returns {Array|Promise} Returns an array of keys.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function keys(collect) {
  if (isUndefined(collect)) return collect => keys(collect);
  if (isObject(collect)) return Object.keys(collect);
  if (isPromise(collect)) return collect.then(c => keys(c));
  if (DEVELOPMENT) throw new Renit("Type error in 'keys' function");
}
