import { reduce } from '../libraries/collect/index.js';
import { isArray, isFunction, isPromise } from '../libraries/is/index.js';

/**
 * It's a structure that connects functions by passing the output of one function as the arguments
 * to another function.
 *
 * @param {Array|Object|Promise|Function} collect - The collection to pipe.
 * @param {...Function} fns - The functions to pipe the collection through.
 * @returns {*} - Returns the result of piping the collection through the functions.
 */
export function pipe(collect, ...fns) {
  if (isFunction(collect)) return c => pipe(c, [collect, ...fns]);
  return reduce(run, collect, fns);
}

function run(a, f) {
  if (isFunction(f)) return isPromise(a) ? a.then(f) : f(a);
  if (isArray(f)) return pipe(a, ...f);
}

/**
 * Creates a deep copy of a collection using the structured cloning algorithm.
 *
 * @param {Array|Object} collect - The collection to clone.
 * @returns {Array|Object} - Returns the cloned collection.
 */
export function clone(collect) {
  return structuredClone(collect);
}

/**
 * Converts a synchronous function to return a Promise.
 *
 * @param {Function} fn - The function to convert.
 * @returns {Function} A function that returns a Promise.
 */
export function prom(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      try {
        const result = fn(...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
}
