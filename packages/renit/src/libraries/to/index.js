/**
  Data Transformation
  ------------------------------------------------------------------------------
  It converts the types or values of variables or constants.
  ------------------------------------------------------------------------------
*/

import { isObject, isUndefined } from '../is/index.js';

/**
 * Converts the specified collection to a string representation.
 *
 * @param {*} [collect] - The collection to convert to a string.
 * @returns {*} Returns the string representation of the collection.
 */
export function toStringify(collect) {
  if (isUndefined(collect)) return collect => toStringify(collect);
  if (isObject(collect)) return JSON.stringify(collect);
  return `${collect}`;
}
