/**
  Collection Interactions
  ------------------------------------------------------------------------------
  Useful helpers for interacting with arrays and objects.
  ------------------------------------------------------------------------------
*/

import { DEV } from '../../core/env.js';
import { Renit } from '../../core/fault.js';
import { clone, pipe } from '../../helpers/index.js';
import {
  isArray,
  isArrayLike,
  isAsync,
  isAsyncIterable,
  isCollect,
  isEmpty,
  isEqual,
  isFunction,
  isNil,
  isNumber,
  isObject,
  isPrimitive,
  isPromise,
  isString,
  isUndefined,
} from '../is/index.js';
import { size } from '../math/index.js';
import { toArray } from '../to/index.js';

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
  if (DEV) throw new Renit("Type error in 'keys' function");
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
  if (DEV) throw new Renit("Type error in 'values' function");
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
  if (DEV) throw new Renit("Type error in 'apply' function");
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
  else if (DEV) throw new Renit("Type error in 'each' function");
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

  if (DEV) throw new Renit("Type error in 'reduce' function");
}

/**
 * Returns an array of [key, value] pairs for each property in an object.
 *
 * @param {*} collect - The object to retrieve entries from.
 * @returns {Array<Array>} Returns an array of [key, value] pairs.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function entries(collect) {
  if (isUndefined(collect)) return collect => entries(collect);
  if (isObject(collect)) return Object.entries(collect);
  if (isPromise(collect)) return collect.then(c => entries(c));
  if (DEV) throw new Renit("Type error in 'entries' function");
}

/**
 * Adds an element to a collection or updates a key-value pair in an object.
 *
 * @param {*} key - The key or element to add to the collection or object.
 * @param {*} value - The value to add to the collection or object.
 * @param {Array|Object|Promise} collect - The collection or object to which the key-value pair or element is added.
 * @returns {Array|Object|Promise} Returns the updated collection or object.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function push(key, value, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(value)) return collect => push(key, 0, collect);
    if (isArray(value)) return push(key, 0, value);
    if (isPromise(value)) return value.then(v => push(key, 0, v));
    return collect => push(key, value, collect);
  }

  if (isArray(collect)) {
    if (value == 1) collect.push(...key);
    else collect.push(key);
    return collect;
  }

  if (isObject(collect)) {
    collect[key] = value;
    return collect;
  }

  if (isPromise(collect)) return collect.then(c => push(key, value, c));

  if (DEV) throw new Renit("Type error in 'push' function");
}

/**
 * Checks if a collection contains a specific item or items.
 *
 * @param {*} items - The item or items to check for in the collection.
 * @param {Array|string} collect - The collection to check.
 * @returns {boolean} Returns true if the collection contains the item(s), otherwise false.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function has(items, collect) {
  if (isUndefined(collect)) return collect => has(collect);
  if (isArray(collect) || isString(collect)) return collect.includes(items);
  // TODO: Add support for multiple items
  if (DEV) throw new Renit("Type error in 'has' function");
}

/**
 * Checks if the object has the specified property.
 * @param {Object} obj - The object to check.
 * @param {string} prop - The property to check for.
 * @returns {boolean} - True if the object has the property, otherwise false.
 */
export function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Merges two collections by concatenating arrays or extending objects.
 *
 * @param {Array|Object|Promise} seed - The first collection.
 * @param {Array|Object|Promise} collect - The second collection.
 * @returns {Array|Object|Promise} Returns the merged collection.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function merge(seed, collect) {
  if (isUndefined(collect)) return collect => merge(seed, collect);
  if (isArray(seed) && isArray(collect)) return collect.concat(seed);

  // prettier-ignore
  if (isObject(seed) && isObject(collect)) return Object.assign(clone(seed), clone(collect));

  if (isPromise(seed)) return seed.then(s => merge(s, collect));
  if (isPromise(collect)) return collect.then(c => merge(seed, c));
  if (DEV) throw new Renit("Type error in 'merge' function");
}

/**
 * Deeply merges two values together.
 *
 * @param {Array|Object|Promise} seed - The initial value or partial result of the merge.
 * @param {Array|Object|Promise} collect - The value to merge with the seed.
 * @returns {Array|Object|Promise} The merged result.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function mergeDeep(seed, collect) {
  if (isUndefined(collect)) return collect => mergeDeep(seed, collect);
  if (isArray(seed) && isArray(collect)) return collect.concat(seed);

  // prettier-ignore
  if (isObject(seed) && isObject(collect)) return mergeDeepObject(clone(seed), clone(collect));

  if (isPromise(seed)) return seed.then(s => mergeDeep(s, collect));
  if (isPromise(collect)) return collect.then(c => mergeDeep(seed, c));
  if (DEV) throw new Renit("Type error in 'mergeDeep' function");
}

/**
 * Recursively merges objects deeply.
 * @param {Object} seed - The initial object.
 * @param  {...Object} collect - Objects to merge into the seed.
 * @returns {Object} - The merged object.
 */
function mergeDeepObject(seed, ...collect) {
  if (!size(collect)) return seed;
  const source = collect.shift();
  if (isObject(seed) && isObject(source)) {
    each(key => {
      if (isObject(source[key])) {
        if (!seed[key]) Object.assign(seed, { [key]: {} });
        mergeDeepObject(seed[key], source[key]);
      } else {
        Object.assign(seed, { [key]: source[key] });
      }
    }, source);
  }

  return mergeDeepObject(seed, ...collect);
}

/**
 * Creates a new collection by applying a function to each element of the original collection.
 *
 * @param {Function} fn - The function to apply to each element.
 * @param {*} collect - The original collection.
 * @returns {*} Returns a new collection with the results of applying the function to each element.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function map(fn, collect) {
  if (isUndefined(collect)) return collect => map(fn, collect);
  if (isArray(collect)) return collect.map(fn);
  if (isAsyncIterable(collect)) {
    const iterator = collect[Symbol.asyncIterator]();
    return {
      async next(concurrent) {
        const { done, value } = await iterator.next(concurrent);
        if (done) return { done, value };
        return {
          done: false,
          value: await fn(value),
        };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  }
  if (isObject(collect)) {
    const collection = {};
    each((key, value) => push(key, fn(value, key), collection), collect);
    return collection;
  }
  if (isPromise(collect)) return collect.then(c => map(fn, c));
  if (DEV) throw new Renit("Type error in 'map' function");
}

/**
 * Reverses the order of elements in an array.
 *
 * @param {*} collect - The array to reverse.
 * @returns {*} Returns a new array with reversed elements.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function reverse(collect) {
  if (isUndefined(collect)) return collect => reverse(collect);
  if (isArray(collect)) return clone(collect).reverse();
  if (DEV) throw new Renit("Type error in 'reverse' function");
}

/**
 * Extracts a section of an array based on the provided starting index and optional limit.
 *
 * @param {(number|number[])} key - The starting index or an array containing [start, limit].
 * @param {*} collect - The array to extract a section from.
 * @returns {*} Returns a new array containing the extracted section.
 * @throws {Renit} - Throws a Renit error if in development mode.
 */
export function slice(key, collect) {
  if (isUndefined(collect)) return collect => slice(key, collect);

  let index;
  let limit;

  if (isArray(key)) {
    index = key[0];
    limit = key[1];
  } else {
    index = key;
  }

  if (isArray(collect)) {
    let collection = collect.slice(index);
    if (!isUndefined(limit)) {
      collection = collection.slice(0, limit);
    }
    return collection;
  }

  if (DEV) throw new Renit("Type error in 'slice' function");
}

/**
 * Changes the contents of an array by removing or replacing existing elements and/or adding new elements in place.
 *
 * @param {*} key - The starting index or an array containing [start, deleteCount, ...items].
 * @param {*} collect - The array to modify.
 * @returns {*} Returns a new array with the modified contents.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function splice(key, collect) {
  if (isUndefined(collect)) return collect => splice(key, collect);

  let index;
  let limit;
  let replace;

  if (isArray(key)) {
    index = key[0];
    limit = key[1];
    replace = key[2];
  } else {
    index = key;
  }

  const s = (...a) => collect.splice(...a);

  if (isArray(collect)) {
    // prettier-ignore
    if (isUndefined(limit) && isUndefined(replace)) return s(index);
    if (isUndefined(replace)) return s(index, limit);
    if (!isUndefined(replace)) return s(index, limit, ...replace);
  }

  if (isPromise(collect)) return collect.then(c => splice(key, c));

  if (DEV) throw new Renit("Type error in 'splice' function");
}

/**
 * Flattens a nested collection to a specified depth.
 *
 * @param {*} depth - The depth to flatten the collection to.
 * @param {*} collect - The collection to flatten.
 * @returns {*} Returns the flattened collection.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function flat(depth, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(depth)) return collect => flat(1, collect);
    if (isNumber(depth)) return collect => flat(depth, collect);
    return flat(1, depth);
  }

  if (isCollect(collect)) return values(collect).flat(depth);
  if (isPromise(collect)) return collect.then(c => flat(depth, c));
  if (DEV) throw new Renit("Type error in 'flat' function");
}

/**
 * Filters elements of a collection based on a provided function or default filtering criteria.
 *
 * @param {*} fn - The function to test each element with or a boolean for default filtering.
 * @param {*} collect - The collection to filter.
 * @returns {*} Returns the filtered collection.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function filter(fn, collect) {
  if (isUndefined(collect)) {
    // prettier-ignore
    if (isUndefined(fn) || isFunction(fn)) return collect => filter(fn, collect);
    return filter(false, fn);
  }

  if (isArray(collect)) {
    if (fn) return collect.filter(fn);
    const result = [];
    each(item => filtered(item) && push(item, result), collect);
    return result;
  }

  if (isObject(collect)) {
    const result = {};
    each((key, value) => {
      if (fn) {
        if (fn(value, key)) {
          push(key, value, result);
        }
      } else if (filtered(value)) {
        push(key, value, result);
      }
    }, collect);
    return result;
  }

  if (isPromise(collect)) return collect.then(c => filter(fn, c));

  if (DEV) throw new Renit("Type error in 'filter' function");
}

/**
 * Default filtering criteria function used in the absence of a custom function.
 *
 * @private
 * @param {*} item - The item to filter.
 * @returns {boolean} Returns true if the item passes default filtering, otherwise false.
 */
function filtered(item) {
  if (isNil(item)) return false;
  if (isArrayLike(item) || isObject(item)) return size(item);
  if (isPrimitive(item)) return true;
  return !isEmpty(item);
}

/**
 * Checks if every element in a collection satisfies a provided function.
 *
 * @param {Function} fn - The function to test each element with.
 * @param {Array|Object|Promise} [collect] - The collection to check.
 * @returns {boolean|Promise<boolean>} Returns true if every element satisfies the provided function, otherwise false.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function every(fn, collect) {
  if (isUndefined(collect)) return collect => every(fn, collect);
  if (isCollect(collect)) return values(collect).every(fn);
  if (isPromise(collect)) return collect.then(c => every(fn, c));
  if (DEV) throw new Renit("Type error in 'every' function");
}

/**
 * Returns the last element in a collection based on a provided function or default criteria.
 *
 * @param {Function|boolean} [fn] - The function to test each element with or a boolean for default criteria.
 * @param {Array|Object|Promise} collect - The collection to retrieve the last element from.
 * @returns {*} Returns the last element in the collection.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function last(fn, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(fn) || isFunction(fn)) return collect => last(fn, collect);
    return last(false, fn);
  }

  if (isFunction(fn)) collect = filter(fn, collect);
  if (isArray(collect)) return collect[size(collect) - 1];
  if (isObject(collect)) {
    const key = keys(collect);
    return collect[key[size(key) - 1]];
  }
  if (isPromise(collect)) return collect.then(c => last(fn, c));
  if (DEV) throw new Renit("Type error in 'last' function");
}

/**
 * Finds the difference between two collections. This method returns the values
 * from the original collection that are not found in the given collection.
 *
 * @param {Array|Object|Promise} values - The first collection.
 * @param {number|Array|Object|Promise} [type] - The second argument or collection.
 * @param {Array|Object|Promise} [collect] - The second collection.
 * @returns {Array|Object|Promise} Returns the difference between the two collections.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function diff(values, type, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(type)) return collect => diff(values, 1, collect);
    if (isCollect(type) || isPromise(type)) return diff(values, 1, type);
    return collect => diff(values, type, collect);
  }

  if (isArray(values) && isArray(collect)) {
    return filter(item => values.indexOf(item) === -1, collect);
  }

  if (isObject(values) && isObject(collect)) {
    const collection = {};

    if (type == 1) {
      // value diff
      each((key, value) => {
        // prettier-ignore
        if (isUndefined(values[key]) || !isEqual(values[key], value)) push(key, value, collection);
      }, collect);
    }

    // TODO: Add finding difference based on object keys

    return collection;
  }

  if (isPromise(values)) return values.then(v => diff(v, collect));
  if (isPromise(collect)) return collect.then(c => diff(values, c));
  if (DEV) throw new Renit("Type error in 'diff' function");
}

/**
 * Determines whether the collection contains a given item
 * @param {string|Function} key - The key to check or a function to apply to each item in the collection.
 * @param {*} value - The value to match (optional).
 * @param {Array|Object} collect - The collection to search.
 * @returns {boolean|Function} - Returns true if the condition is met, otherwise false.
 */
export function some(key, value, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(value)) {
      return collect => some(key, collect);
    }

    if (isPromise(value)) return value.then(v => some(key, void 0, v));

    if (!isCollect(value)) {
      return collect => some(key, value, collect);
    }

    return some(key, void 0, value);
  }

  if (isPromise(key)) return key.then(k => some(k, value, collect));
  if (isPromise(value)) return value.then(v => some(key, v, collect));
  if (isPromise(collect)) return collect.then(c => some(key, value, c));

  if (!isUndefined(value)) {
    if (isArray(collect)) {
      // Check if the key-value pair exists in an array of objects
      return (
        pipe(
          collect,
          filter(items => !isUndefined(items[key]) && items[key] === value),
          size
        ) > 0
      );
    }
    // Check if the key-value pair exists in an object
    return !isUndefined(collect[key]) && collect[key] === value;
  }

  if (isFunction(key)) {
    // Check if any item in the collection satisfies the condition provided by the function
    return (
      pipe(
        collect,
        filter((item, index) => key(item, index)),
        toArray,
        size
      ) > 0
    );
  }

  if (isArray(collect)) {
    // Check if a value exists in an array
    return collect.indexOf(key) !== -1;
  }

  // Check if a key exists in an object
  const keysAndValues = values(collect);
  push(keys(collect), 1, keysAndValues);
  return keysAndValues.indexOf(key) !== -1;
}
