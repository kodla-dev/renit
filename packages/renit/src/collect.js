import { DEVELOPMENT } from './define.js';
import { Renit } from './fault.js';
import {
  isArray,
  isArrayLike,
  isAsync,
  isCollect,
  isObject,
  isPromise,
  isUndefined,
} from './is.js';
import { size } from './math.js';

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

/**
 * Asynchronously or synchronously iterates over a collection of a specified length and applies a function to each index.
 *
 * @param {Function} fn - The function to apply to each index.
 * @param {number|Array|Object|Promise} length - The length or collection to iterate over.
 * @returns {*} Returns a Promise if the function is asynchronous and has a result, otherwise undefined.
 */
export async function loop(fn, length) {
  let index = 0;

  if (isPromise(length)) length = await size(length);
  else if (isArrayLike(length)) length = size(length);

  for (index; index < length; index++) {
    const result = isAsync(fn) ? await fn(index) : fn(index);
    if (!isUndefined(result)) return result;
  }
}

/**
 * Iterates over each element in a collection and applies a function.
 *
 * @param {Function} fn - The function to apply to each element.
 * @param {Array|Object|Promise} collect - The collection to iterate over.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function each(fn, collect) {
  if (isUndefined(collect)) return collect => each(fn, collect);
  else if (isArray(collect)) {
    loop(index => {
      fn(collect[index], index);
    }, collect);
  } else if (isObject(collect)) {
    const object = keys(collect);
    loop(index => {
      const key = object[index];
      const value = collect[key];
      fn(key, value, index);
    }, object);
  } else if (isPromise(collect)) return collect.then(c => each(fn, c));
  else if (DEVELOPMENT) throw new Renit("Type error in 'each' function");
}

/**
 * Reduces a collection to a single value by applying a function to each element.
 *
 * @param {Function|Array} fn - The function to apply to each element or an array containing [fn, seed].
 * @param {*} [seed] - The initial value or collection to start the reduction.
 * @param {Array|Object} [collect] - The collection to reduce.
 * @returns {*} Returns the reduced value.
 * @throws {Renit} - Throws a Renit error if in development mode.
 */
export function reduce(fn, seed, collect) {
  if (isUndefined(collect)) {
    if (isArray(fn)) return collect => reduce(fn[0], fn[1], collect);
    if (isUndefined(seed)) return collect => reduce(fn, collect);
    return reduce(fn, 0, seed);
  }

  if (isArray(collect)) {
    each(item => {
      seed = fn(seed, item);
    }, collect);
    return seed;
  }

  if (isObject(collect)) {
    each(key => {
      seed = fn(seed, collect[key], key);
    }, collect);
    return seed;
  }

  if (DEVELOPMENT) throw new Renit("Type error in 'reduce' function");
}
