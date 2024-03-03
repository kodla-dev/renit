/**
  Type and Value Checks
  --------------------------------------------------------------------------------------------------
  Provides information about the types, values of variables or constants, and general details about
  the environment in which the system operates.
  --------------------------------------------------------------------------------------------------
*/

import { RAW_ASYNC_FUNCTION, RAW_BOOLEAN, RAW_FUNCTION } from './define.js';

/**
 * Checks if the specified value is an array.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('./type.js').Include<R, unknown[] | Readonly<unknown[]>>}
 * Returns true if the value is an array, false otherwise.
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Checks if two given values are equal.
 *
 * @param {unknown} test1 - First value to compare.
 * @param {unknown} test2 - Second value to compare.
 * @returns {boolean} Returns true if the values are equal, false otherwise.
 */
export function isEqual(test1, test2) {
  if (test1 === test2) return true;
  if (typeof test1 !== typeof test2 || test1 !== Object(test1) || !test1 || !test2) return false;
  return true;
}

/**
 * Checks if the specified value is of boolean data type.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('./type.js').Include<R, boolean>}
 * Returns true if the value is a boolean, false otherwise.
 */
export function isBoolean(value) {
  return isEqual(typeof value, RAW_BOOLEAN);
}

/**
 * Checks if the specified value is a function.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('./type.js').Include<R, CallableFunction>}
 * Returns true if the value is a function, false otherwise.
 */
export function isFunction(value) {
  return isEqual(typeof value, RAW_FUNCTION);
}

/**
 * Checks if the specified value is an asynchronous function.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('./type.js').Include<R, import('./type.js').AsyncArrow>}
 * Returns true if the value is an asynchronous function, false otherwise.
 */
export function isAsync(value) {
  return isFunction(value) && isEqual(value.constructor.name, RAW_ASYNC_FUNCTION);
}
