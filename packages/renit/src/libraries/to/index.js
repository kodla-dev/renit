/**
  Data Transformation
  ------------------------------------------------------------------------------
  It converts the types or values of variables or constants.
  ------------------------------------------------------------------------------
*/

import { values } from '../collect/index.js';
import {
  isArray,
  isAsyncIterable,
  isCollect,
  isObject,
  isPromise,
  isUndefined,
} from '../is/index.js';

/**
 * Converts a value into an array.
 *
 * @param {*} collect - The value to convert into an array.
 * @returns {Array|function} - The resulting array or a partially applied function.
 */
export function toArray(collect) {
  if (isUndefined(collect)) return collect => toArray(collect);
  if (isArray(collect)) {
    return Array.from(collect);
  } else if (isAsyncIterable(collect)) {
    return toArrayAsync(collect);
  } else if (isObject(collect)) {
    return values(collect);
  } else {
    return [collect];
  }
}

/**
 * Asynchronously converts an async iterable into an array.
 * @param {AsyncIterable} iterable - The async iterable to convert into an array.
 * @returns {Array} - Resolves to an array of the iterable items.
 */
async function toArrayAsync(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

/**
 * Converts an iterable into an asynchronous iterable.
 * @param {Iterable} iter - The iterable to convert into an asynchronous iterable.
 * @returns {Object} - An asynchronous iterable object with async iterator methods.
 */
export function toAsync(iter) {
  const iterator = iter[Symbol.iterator]();
  return {
    async next() {
      const { value, done } = iterator.next();
      if (isPromise(value)) {
        return value.then(value => ({ done, value }));
      } else {
        return { done, value };
      }
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

/**
 * Converts the specified collection to JSON format.
 *
 * @param {*} collect - The value to convert into a JSON string.
 * @returns {string|function} - The resulting JSON string or a partially applied function.
 */
export function toJson(collect) {
  if (isUndefined(collect)) return collect => toJson(collect);

  if (isObject(collect)) {
    return JSON.stringify(collect);
  } else if (isArray(collect)) {
    return JSON.stringify(toArray(collect));
  }

  return `${collect}`;
}

/**
 * Converts the specified collection to a string representation.
 *
 * @param {*} collect - The value to convert to a string.
 * @returns {string|function} - Returns the string representation of the collection.
 */
export function toString(collect) {
  if (isUndefined(collect)) return collect => toString(collect);
  if (isCollect(collect)) return collect.toString();
  return `${collect}`;
}

/**
 * Converts the specified collection to a string representation.
 * using JSON.stringify
 *
 * @param {*} [collect] - The collection to convert to a string.
 * @returns {string|function} Returns the string representation of the collection.
 */
export function toStringify(collect) {
  if (isUndefined(collect)) return collect => toStringify(collect);
  if (isObject(collect)) return JSON.stringify(collect);
  return `${collect}`;
}

export { astToHtml, htmlToAst } from './parser/parse/html.js';
