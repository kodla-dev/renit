import { reduce } from '../collect/index.js';
import { DEVELOPMENT } from '../define.js';
import { Renit } from '../fault.js';
import { isArray, isFunction, isPromise } from '../is/index.js';

/**
 * It's a structure that connects functions by passing the output of one function as the arguments
 * to another function.
 *
 * @param {Array|Object|Promise|Function} collect - The collection to pipe.
 * @param {...Function} fns - The functions to pipe the collection through.
 * @returns {*} - Returns the result of piping the collection through the functions.
 * @throws {Renit} - Throws a Renit error if in development mode.
 */
export function pipe(collect, ...fns) {
  if (isFunction(collect)) return c => pipe(c, [collect, ...fns]);
  return reduce(run, collect, fns);
}

function run(a, f) {
  if (isFunction(f)) return isPromise(a) ? a.then(f) : f(a);
  if (isArray(f)) return pipe(a, ...f);
  if (DEVELOPMENT) throw new Renit("Type error in 'pipe' function");
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
