/**
  Collection Interactions
  ------------------------------------------------------------------------------
  Useful helpers for interacting with arrays and objects.
  ------------------------------------------------------------------------------
*/

import { DEV } from '../../core/env.js';
import { Renit } from '../../core/fault.js';
import { pipe } from '../../helpers/index.js';
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
 * Splits a collection into chunks of a specified length.
 * @param {number} length - The length of each chunk.
 * @param {Array|Object} [collect] - The collection to be chunked.
 * @returns {Array|Function} - An array of chunks if the collection is provided.
 */
export function chunk(length, collect) {
  if (isUndefined(collect)) return collect => chunk(length, collect);
  if (isPromise(collect)) return collect.then(c => chunk(length, c));

  const chunks = [];
  let index = 0;
  if (isArray(collect)) {
    do {
      const collection = slice([index, index + length], collect);
      push(collection, chunks);
      index += length;
    } while (index < size(collect));
  } else {
    const collectKeys = keys(collect);
    do {
      const keysOfChunk = slice([index, index + length], collectKeys);
      const collection = {};
      each(key => push(key, collect[key], collection), keysOfChunk);
      push(collection, chunks);
      index += length;
    } while (index < size(collectKeys));
  }

  return chunks;
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
 * Creates a map of keys from a nested collection.
 *
 * @param {Array|Object} collect - Collection to map keys from.
 * @returns {Object} Map of keys and their corresponding values.
 */
export function keyMap(collect) {
  if (isUndefined(collect)) return collect => keyMap(collect);

  const paths = {};

  each((item, index) => {
    buildKeyMap(item, index, paths);
  }, collect);

  return paths;
}

/**
 * Recursively builds the key map for a given item.
 *
 * @param {any} item - Current item to process.
 * @param {string} index - Current index or key.
 * @param {Object} paths - Object to store the key map.
 */
function buildKeyMap(item, index, paths) {
  if (isObject(item)) {
    each((key, value) => {
      buildKeyMap(value, `${index}.${key}`, paths);
    }, item);
  } else if (isArray(item)) {
    each((value, i) => {
      buildKeyMap(value, `${index}.${i}`, paths);
    }, item);
  }

  paths[index] = item;
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
  if (isObject(collect)) return hasOwn(items, collect);
  // TODO: Add support for multiple items
  if (DEV) throw new Renit("Type error in 'has' function");
}

/**
 * Checks if the object has the specified property.
 * @param {string} prop - The property to check for.
 * @param {Object} obj - The object to check.
 * @returns {boolean} - True if the object has the property, otherwise false.
 */
export function hasOwn(prop, obj) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

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
 * Returns the last element in a collection based on a provided function or default criteria.
 *
 * @param {Function|boolean} [fn] - The function to test each element with or a boolean for default criteria.
 * @param {Array|Object|Promise} collect - The collection to retrieve the last element from.
 * @returns {*} Returns the last element in the collection.
 * @throws {Renit} - Throws a Renit error if development mode.
 */
export function last(fn, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(fn) || isFunction(fn) || isNumber(fn)) return collect => last(fn, collect);
    return last(false, fn);
  }

  if (isFunction(fn)) collect = filter(fn, collect);
  if (isNumber(fn)) return pop(fn, collect);
  if (isArray(collect)) return collect[size(collect) - 1];
  if (isObject(collect)) {
    const key = keys(collect);
    return collect[key[size(key) - 1]];
  }
  if (isPromise(collect)) return collect.then(c => last(fn, c));
  if (DEV) throw new Renit("Type error in 'last' function");
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
  if (isObject(seed) && isObject(collect)) return Object.assign(collect, seed);

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
  if (isObject(seed) && isObject(collect)) return mergeDeepObject(collect, seed);

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
 * Applies a function to each element in the collection, returns the original collection.
 *
 * @param {Function} fn - Function to apply to each element.
 * @param {Array|Object} [collect] - Collection to iterate over.
 * @returns {Function|Array|Object} Function if `collect` is undefined, otherwise the original collection.
 */
export function peek(fn, collect) {
  if (isUndefined(collect)) return collect => peek(fn, collect);
  return map(tap(fn), collect);
}

/**
 * Extracts values associated with a specified key from a collection.
 *
 * @param {string} key - The key to pluck values for.
 * @param {string} [seed] - Optional seed key to structure the result.
 * @param {Array|Object} [collect] - The collection to pluck values from.
 * @returns {Function|Array|Object} Function if `collect` is undefined, otherwise the plucked values.
 */
export function pluck(key, seed, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(seed)) return collect => pluck(key, collect);
    return pluck(key, void 0, seed);
  }

  let fn = value;
  let collection = [];

  // Initialize collection as an object if seed is provided
  if (!isUndefined(seed)) collection = {};

  // Use wildcard function if key contains '*'
  if (key.indexOf('*') !== -1) fn = pluckWildcard;

  if (isArray(collect)) {
    each(item => {
      pluckInit(fn, key, item, seed, collection);
    }, collect);

    return collection;
  } else {
    pluckInit(fn, key, collect, seed, collection);
    return collection;
  }
}

/**
 * Handles wildcard keys and extracts matching values from the collection.
 *
 * @param {string} key - The wildcard key.
 * @param {Array|Object} collect - The collection to pluck values from.
 * @returns {Array} The plucked values.
 */
function pluckWildcard(key, collect) {
  collect = [collect];
  const collection = [];
  const paths = keyMap(collect);
  const regex = new RegExp(`0.${key}`, 'g');
  const numberOfLevels = size(split('.', `0.${key}`));
  pipe(
    collect,
    keyMap(),
    keys(),
    map(k => {
      const matching = k.match(regex);
      if (matching) {
        const match = matching[0];
        if (size(split('.', match)) === numberOfLevels) {
          push(paths[match], collection);
        }
      }
    })
  );
  return collection;
}

/**
 * Initializes the plucking process and merges results into the collection.
 *
 * @param {Function} fn - Function to apply to each element.
 * @param {string} key - The key to pluck values for.
 * @param {any} item - The current item to process.
 * @param {string} [seed] - Optional seed key to structure the result.
 * @param {Array|Object} collection - The collection to store the results.
 */
function pluckInit(fn, key, item, seed, collection) {
  const result = fn(key, item);
  let seedResult = null;

  // If seed is provided, extract the seed result
  if (!isUndefined(seed)) seedResult = fn(seed, item);

  // Merge the result into the collection
  if (seedResult) {
    merge({ [seedResult]: result }, collection);
  } else {
    push(result, collection);
  }
}

/**
 * Removes and returns the last item from the collection.
 * @param {number} [length=1] - The number of elements to pop.
 * @param {Array|Object} [collect] - The collection from which elements are to be popped.
 * @returns {*} - The popped element(s) from the collection.
 */
export function pop(length, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(length)) return collect => pop(length, collect);
    return pop(void 0, length);
  }
  if (isPromise(collect)) return collect.then(c => pop(length, c));

  if (isUndefined(length)) length = 1;
  if (isEmpty(collect)) return null;
  if (isArray(collect)) {
    if (length === 1) {
      return collect.pop();
    }
    return splice(-length, collect);
  }
  if (isObject(collect)) {
    const cKeys = keys(collect);
    if (length === 1) {
      const key = cKeys[size(cKeys) - 1];
      const last = collect[key];
      remove(key, collect);
      return last;
    }
    const poppedKeys = slice(-length, cKeys);
    const newObject = reduce(
      (acc, current) => {
        acc[current] = collect[current];
        return acc;
      },
      {},
      poppedKeys
    );
    remove(collect, poppedKeys);
    return newObject;
  }

  return null;
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
 * Removes specified keys from a collection.
 * @param {Array|string} keys - The keys to be removed from the collection.
 * @param {Object|Array} [collect] - The collection from which keys are to be removed.
 * @returns {Object|Array|Function} - The modified collection with the keys removed.
 */
export function remove(keys, collect) {
  if (isUndefined(collect)) return collect => remove(keys, collect);
  if (isPromise(collect)) return collect.then(c => remove(keys, c));

  if (isArray(keys)) {
    each(key => delete collect[key], keys);
  } else {
    delete collect[keys];
  }

  return collect;
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
  if (isArray(collect)) return collect.reverse();
  if (DEV) throw new Renit("Type error in 'reverse' function");
}

/**
 * Removes and returns the first item from the collection.
 *
 * @param {number} [count] - The number of elements to shift.
 * @param {Array|Promise} [collect] - The collection or a promise that resolves to a collection.
 * @returns {Function|any|null} If the collection is an array, returns the shifted elements.
 */
export function shift(count, collect) {
  if (isUndefined(collect)) {
    if (isUndefined(count)) return collect => shift(count, collect);
    return shift(void 0, count);
  }

  if (isPromise(collect)) return collect.then(c => shift(c));
  if (isUndefined(count)) count = 1;

  if (isArray(collect)) {
    if (isEqual(count, 1)) {
      return collect.shift();
    }
    return splice([0, count], collect);
  }
  // TODO: object support
  return null;
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
  let segment;

  if (isArray(key)) {
    index = key[0];
    limit = key[1];
    segment = key[2];
  } else {
    index = key;
  }

  if (isArray(collect)) {
    let collection;
    if (!isUndefined(segment)) {
      collection = collect.slice(index);
      collection = collection.slice(0, limit);
    } else {
      if (!isUndefined(limit)) {
        collection = collect.slice(index, limit);
      } else {
        collection = collect.slice(index);
      }
    }
    return collection;
  }

  if (DEV) throw new Renit("Type error in 'slice' function");
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
 * Splits a collection based on a key or a specified number of groups.
 * @param {string|number} key - The delimiter for splitting strings or the number of groups.
 * @param {Array|Object|string} [collect] - The collection to be split.
 * @returns {Array|string|Function} - An array of split groups if the collection is provided.
 */
export function split(key, collect) {
  if (isUndefined(collect)) return collect => split(key, collect);
  if (isPromise(collect)) return collect.then(c => split(key, c));

  if (isString(collect)) return collect.split(key);

  const collection = [];
  const itemsPerGroup = Math.round(size(collect) / key);
  loop(() => {
    const spliceValue = splice([0, itemsPerGroup], collect);
    push(spliceValue, collection);
  }, key);

  return collection;
}

/**
 * Takes a specified number of elements from a collection.
 *
 * @param {number} size - Number of elements to take. If negative, takes from the end.
 * @param {Array|Object} [collect] - Collection to take from.
 * @returns {Function|Array|Object} Function if `collect` is undefined, otherwise sliced collection.
 */
export function take(size, collect) {
  if (isUndefined(collect)) return collect => take(size, collect);

  if (isObject(collect)) {
    const collectKeys = keys(collect);
    let slicedKeys;

    if (size < 0) {
      slicedKeys = slice(size, collectKeys);
    } else {
      slicedKeys = slice([0, size], collectKeys);
    }

    const collection = {};

    each(prop => {
      if (slicedKeys.indexOf(prop) !== -1) {
        collection[prop] = collect[prop];
      }
    }, collectKeys);

    return collection;
  }

  if (size < 0) {
    return slice(size, collect);
  }

  return slice([0, size], collect);
}

/**
 * Returns items in the collection until the given callback returns `true`
 *
 * @param {Function|any} fn - Condition function or value to stop taking elements.
 * @param {Array|Object} [collect] - Collection to take from.
 * @returns {Function|Array|Object} Function if `collect` is undefined, otherwise filtered collection.
 */
export function takeUntil(fn, collect) {
  if (isUndefined(collect)) return collect => takeUntil(fn, collect);

  let previous = null;
  let items;
  let callback = value => value === fn;

  if (isFunction(fn)) {
    callback = fn;
  }

  if (isArray(collect)) {
    items = filter(item => {
      if (previous !== false) {
        previous = !callback(item);
      }
      return previous;
    }, collect);
  } else if (isObject(collect)) {
    items = pipe(
      collect,
      keys(),
      reduce([
        (acc, key) => {
          if (previous !== false) {
            previous = !callback(collect[key]);
          }

          if (previous !== false) {
            acc[key] = collect[key];
          }

          return acc;
        },
        {},
      ])
    );
  }

  return items;
}

/**
 * Executes a function with the provided collection and returns the original collection.
 *
 * @param {Function} fn - Function to execute with the collection.
 * @param {Array|Object} [collect] - Collection to pass to the function.
 * @returns {Function|Array|Object} Function if `collect` is undefined, otherwise the original collection.
 */
export function tap(fn, collect) {
  if (isUndefined(collect)) return collect => tap(fn, collect);
  fn(collect);
  return collect;
}

/**
 * Retrieves the value of a specified key from a collection.
 * @param {string} key - The key whose value is to be retrieved.
 * @param {Object|Array} [collect] - The collection from which to retrieve the value.
 * @returns {*} - The value(s) corresponding to the key.
 */
export function value(key, collect) {
  if (isUndefined(collect)) return collect => value(key, collect);
  if (isPromise(collect)) return collect.then(c => value(key, c));

  if (isArray(collect)) {
    const collection = [];
    each(item => {
      push(value(key, item), collection);
    }, collect);
    return collection;
  }

  // Splits a dot-separated key and accesses the nested property in an object.
  return reduce(
    (o, p) => {
      return o[p];
    },
    collect,
    split('.', key)
  );
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
