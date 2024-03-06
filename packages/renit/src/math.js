import { keys } from './collect.js';
import { isArrayLike, isObject, isPromise, isUndefined } from './is.js';

/**
 * Returns the size of the specified collection.
 *
 * @param {*} [collect] - The collection to determine the size of.
 * @returns {number} Returns the size of the collection.
 */
export function size(collect) {
  if (isUndefined(collect)) return collect => size(collect);
  if (isArrayLike(collect)) return length(collect);
  if (isObject(collect)) return length(keys(collect));
  if (collect?.size) return collect.size;
  if (isPromise(collect)) return collect.then(c => size(c));
  return 0;
}

/**
 * Returns the length of an array or array-like object.
 *
 * @private
 * @param {Array|String} collect - The array or array-like object.
 * @returns {number} - Returns the length of the array or array-like object.
 */
function length(collect) {
  return collect.length;
}
