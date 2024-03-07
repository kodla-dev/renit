import { DEVELOPMENT } from './define.js';
import { Renit } from './fault.js';
import { isArray, isCollect, isObject, isPromise, isUndefined } from './is.js';

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

/**
 * Returns an array containing the values of the specified collection.
 *
 * @param {Array|Object|Promise} [collect] - The collection to extract values from.
 * @returns {Array} Returns an array of values.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function values(collect) {
  if (isUndefined(collect)) return collect => values(collect);
  if (isArray(collect)) return collect;
  if (isObject(collect)) return Object.values(collect);
  if (isPromise(collect)) return collect.then(c => values(c));
  if (DEVELOPMENT) throw new Renit("Type error in 'values' function");
}

/**
 * Applies the specified function to the values of the collection.
 *
 * @param {Function} fn - The function to apply.
 * @param {Array|Object|Promise} [collect] - The collection of values.
 * @returns {*} Returns the result of applying the function to the collection values.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function apply(fn, collect) {
  if (isUndefined(collect)) return collect => apply(fn, collect);
  if (isCollect(collect)) return fn(...values(collect));
  if (isPromise(collect)) return collect.then(c => apply(fn, c));
  if (DEVELOPMENT) throw new Renit("Type error in 'apply' function");
}
