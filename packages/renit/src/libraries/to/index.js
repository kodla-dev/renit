/**
  Data Transformation
  ------------------------------------------------------------------------------
  It converts the types or values of variables or constants.
  ------------------------------------------------------------------------------
*/

import { values } from '../collect/index.js';
import { isArray, isCollect, isObject, isUndefined } from '../is/index.js';

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
  } else if (isObject(collect)) {
    return values(collect);
  } else {
    return [collect];
  }
}

export { htmlToAst } from './parser/parse/html.js';
