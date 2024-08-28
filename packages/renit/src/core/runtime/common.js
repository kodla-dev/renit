import { isFunction } from '../../libraries/is/index.js';

// Alias for console.error to log error messages.
export const error = console.error;

/**
 * Safely executes a callback function, catching and ignoring any errors.
 * @param {Function} callback - The callback function to execute.
 * @returns {Any} The result of the callback function, or undefined if an error occurred.
 */
export function safe(callback) {
  try {
    return callback?.();
  } catch (e) {
    error(e);
  }
}

/**
 * Safely executes a list of callback functions, catching and ignoring any errors.
 * @param {Array<Function>} list - The list of callback functions to execute.
 */
export function safeGroup(list) {
  try {
    list?.forEach(fn => fn?.());
  } catch (e) {
    error(e);
  }
}

/**
 * Safely executes a list of callback functions and collects their results.
 * If only functions are collected, the `onlyFn` parameter should be true.
 * @param {Array<Function>} list - The list of callback functions to execute.
 * @param {Array} results - The array to collect the results.
 * @param {Boolean} [onlyFn=false] - If true, only functions will be collected.
 */
export function safeMulti(list, results, onlyFn) {
  list?.forEach(callback => {
    let result = safe(callback);
    result && (!onlyFn || isFunction(result)) && results.push(result);
  });
}
