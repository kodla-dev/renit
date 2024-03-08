/**
  Type and Value Checks
  --------------------------------------------------------------------------------------------------
  Provides information about the types, values of variables or constants, and general details about
  the environment in which the system operates.
  --------------------------------------------------------------------------------------------------
*/

import { keys } from '../collect/index.js';
import {
  MAX_SAFE_INTEGER,
  RAW_ASYNC,
  RAW_ASYNC_FUNCTION,
  RAW_BOOLEAN,
  RAW_CLASS,
  RAW_FUNCTION,
  RAW_NAN,
  RAW_NULL,
  RAW_NUMBER,
  RAW_OBJECT,
  RAW_PROMISE,
  RAW_STRING,
  RAW_SYMBOL,
  RAW_UNDEFINED,
} from '../define.js';
import { size } from '../math/index.js';
import { toStringify } from '../to/index.js';

/**
 * Checks if the specified value is an array.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, unknown[] | Readonly<unknown[]>>}
 * Returns true if the value is an array, false otherwise.
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Checks if the specified value resembles an array.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, import('../type.js').ArrayLikeLiteral>}
 * Returns true if the value is array-like, false otherwise.
 */
export function isArrayLike(value) {
  const len = !!value && value.length;
  return (
    (!isNil(value) &&
      !isFunction(value) &&
      isNumber(len) &&
      len > -1 &&
      len % 1 === 0 &&
      len <= MAX_SAFE_INTEGER) ||
    isString(value)
  );
}

/**
 * Checks if the specified value is an asynchronous function.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, import('../type.js').AsyncArrow>}
 * Returns true if the value is an asynchronous function, false otherwise.
 */
export function isAsync(value) {
  return isFunction(value) && isEqual(value.constructor.name, RAW_ASYNC_FUNCTION);
}

/**
 * Checks if the specified value is an asynchronous iterable.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, AsyncIterator<R>>}
 * Returns true if the value is an asynchronous iterable, false otherwise.
 */
export function isAsyncIterable(value) {
  return isFunction(value?.[Symbol.asyncIterator]);
}

/**
 * Checks if the specified value is of boolean data type.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, boolean>}
 * Returns true if the value is a boolean, false otherwise.
 */
export function isBoolean(value) {
  return isEqual(typeof value, RAW_BOOLEAN);
}

/**
 * Checks if the specified value is a class.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, import('../type.js').ClassLiteral>}
 * Returns true if the value is a class, false otherwise.
 */
export function isClass(value) {
  return isFunction(value) && /^\s*class\s+/.test(value.toString());
}

/**
 * Checks if the environment in which the system operates is a client.
 *
 * @returns {boolean} Returns true if running in a client-side environment,
 * false otherwise.
 */
export function isClient() {
  return isEqual(typeof window, RAW_OBJECT);
}

/**
 * Checks if the specified value is a collection. We use the term 'collection'
 * to encompass both Array and Object types in a single category.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, import('../type.js').$collect>}
 * Returns true if the value is an array or an object, false otherwise.
 */
export function isCollect(value) {
  return isArray(value) || isObject(value);
}

/**
 * Checks if the specified value belongs to an date class.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, Date>}
 * Returns true if the value is date, false otherwise.
 */
export function isDate(value) {
  return value instanceof Date;
}

/**
 * Checks if a value is an Element object.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns true if the value is an Element object, otherwise false.
 */
export function isElement(value) {
  return value instanceof Element;
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
  if (isArray(test1) && isArray(test2)) {
    const len = size(test1);
    if (len !== size(test2)) return false;

    for (let i = 0; i < len; i++) {
      if (!isEqual(test1[i], test2[i])) return false;
    }

    return true;
  }
  if (isObject(test1) && isObject(test2)) {
    const test1Keys = keys(test1);
    const len = size(test1Keys);
    if (len !== size(keys(test2))) return false;
    for (let i = 0; i < len; i++) {
      const key = test1Keys[i];
      // prettier-ignore
      if (!(
        Object.prototype.hasOwnProperty.call(test2, key) &&
        isEqual(test1[key], test2[key])
        )) return false;
    }
    return true;
  }
  return toStringify(test1) === toStringify(test2);
}

/**
 * Checks if the specified value belongs to an error class.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, Error>}
 * Returns true if the value is an Error instance, false otherwise.
 */
export function isError(value) {
  return value instanceof Error;
}

/**
 * Checks if the specified value is an even number.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is an even number, false otherwise.
 */
export function isEven(value) {
  if (!isNumber(value)) return false;
  return value % 2 === 0;
}

/**
 * Checks if a given value is equal to false.
 *
 * @param {*} value - The value to check.
 * @returns {value is import('../type.js').Include<R, false>}
 * Returns true if the value is equal to false, otherwise false.
 */
export function isFalse(value) {
  return isEqual(value, false);
}

/**
 * Checks if a given value is falsy.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} Returns true if the value is falsy, otherwise false.
 */
export function isFalsy(value) {
  return !value;
}

/**
 * Checks if the specified value is a floating-point number.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is a floating-point number, false otherwise.
 */
export function isFloat(value) {
  return isNumber(value) && !isInteger(value);
}

/**
 * Checks if the specified value is a function.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, CallableFunction>}
 * Returns true if the value is a function, false otherwise.
 */
export function isFunction(value) {
  return isEqual(typeof value, RAW_FUNCTION);
}

/**
 * Checks if the specified value is an integer.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is an integer, false otherwise.
 */
export function isInteger(value) {
  return Number.isInteger(value);
}

/**
 * Checks if the specified collection is iterable.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, Iterator<R>>}
 * Returns true if the value is iterable, false otherwise.
 */
export function isIterable(value) {
  return isFunction(value?.[Symbol.iterator]);
}

/**
 * Checks if the desired value is a key belonging to the specified source.
 * @param {string|number} key - The key to check.
 * @param {object} source - The source object.
 * @returns {boolean} Return true if the key represents a property; otherwise, false.
 */
export function isKey(key, source) {
  if (!isObject(source) || !isString(key) || !isNumber(key)) {
    return false;
  }

  return !isUndefined(source[key]);
}

/**
 * Checks if `localStorage` support is available.
 *
 * @returns {boolean} Returns true if localStorage is available, false otherwise.
 */
export function isLocalStorage() {
  return isClient() && Boolean(window.localStorage);
}

/**
 * Checks if the specified value is an `NaN`.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is NaN, false otherwise.
 */
export function isNaN(value) {
  return Number.isNaN(value);
}

/**
 * Checks if the specified value is null or undefined.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, null | undefined>}
 * Returns true if the value is null or undefined, false otherwise.
 */
export function isNil(value) {
  return isUndefined(value) || isNull(value);
}

/**
 * Checks if a value is a Node object.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns true if the value is a Node object, otherwise false.
 */
export function isNode(value) {
  return value instanceof Node;
}

/**
 * Checks if a value can be used as a valid node value.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns true if the value can be used as a valid node value, otherwise false.
 */
export function isNodeValue(value) {
  return !isNull(value) && !isBoolean(value);
}

/**
 * Checks if the specified value is null.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, null>}
 * Returns true if the value is null, false otherwise.
 */
export function isNull(value) {
  return isEqual(value, null);
}

/**
 * Checks if the specified value is a number.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is a number, false otherwise.
 */
export function isNumber(value) {
  return isEqual(typeof value, RAW_NUMBER);
}

/**
 * Checks if the specified value is a real object.
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, import('../type.js').$object>}
 * Returns true if the value is a object, false otherwise.
 */
export function isObject(value) {
  return !isNil(value) && isEqual(typeof value, RAW_OBJECT) && isEqual(value.constructor, Object);
}

/**
 * Checks if the specified value is an object.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, object>}
 * Returns true if the value is a object, false otherwise.
 */
export function isObjects(value) {
  return isEqual(typeof value, RAW_OBJECT) || isFunction(value);
}

/**
 * Checks if the specified value is an odd number.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, number>}
 * Returns true if the value is an odd number, false otherwise.
 */
export function isOdd(value) {
  if (!isNumber(value)) return false;
  return value % 2 === 1;
}

/**
 * Checks if a given value is a primitive type.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} Returns true if the value is primitive, otherwise false.
 */
export function isPrimitive(value) {
  return Object(value) !== value;
}

/**
 * Checks if the specified value is a promise.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, Promise<unknown>>}
 * Returns true if the value is a Promise, false otherwise.
 */
export function isPromise(value) {
  if (value instanceof Promise) return true;
  return !isNil(value) && isFunction(value.then);
}

/**
 * Checks if the specified value is a regular expression.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, RegExp>}
 * Returns true if the value is a regular expression, false otherwise.
 */
export function isRegExp(value) {
  return (
    value instanceof RegExp || isEqual(Object.prototype.toString.call(value), '[object RegExp]')
  );
}

/**
 * Checks if the code is running in a server-side environment.
 *
 * @returns {boolean} Returns true if running in a server-side environment,
 * false otherwise.
 */
export function isServer() {
  return isEqual(typeof window, RAW_UNDEFINED);
}

/**
 * Checks if the specified value is a string.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, string>}
 * Returns true if the value is a string, false otherwise.
 */
export function isString(value) {
  return isEqual(typeof value, RAW_STRING) || value instanceof String;
}

/**
 * Checks if the specified value is a symbol.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, symbol>}
 * Returns true if the value is a symbol, false otherwise.
 */
export function isSymbol(value) {
  return isEqual(typeof value, RAW_SYMBOL);
}

/**
 * Checks if a given value is equal to true.
 *
 * @param {*} value - The value to check.
 * @returns {value is import('../type.js').Include<R, true>}
 * Returns true if the value is equal to true, otherwise false.
 */
export function isTrue(value) {
  return isEqual(value, true);
}

/**
 * Checks if a given value is truthy.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} Returns true if the value is truthy, otherwise false.
 */
export function isTruthy(value) {
  return !!value;
}

/**
 * Determines the real type of the current value.
 *
 * @template R
 * @param {R} value - The value whose data type will be taken.
 * @returns {string} - The data type of the value.
 */
export function isType(value) {
  if (isNull(value)) {
    return RAW_NULL;
  } else if (isUndefined(value)) {
    return RAW_UNDEFINED;
  } else if (isNaN(value)) {
    return RAW_NAN;
  } else if (isAsync(value)) {
    return RAW_ASYNC;
  } else if (isPromise(value)) {
    return RAW_PROMISE;
  } else if (isClass(value)) {
    return RAW_CLASS;
  }
  const type = Object.prototype.toString.call(value).slice(8, -1);
  return type.charAt(0).toLowerCase() + type.slice(1);
}

/**
 * Checks if the specified value is undefined.
 *
 * @template R
 * @param {R} value - The value to check.
 * @returns {value is import('../type.js').Include<R, undefined>}
 * Returns true if the value is undefined, false otherwise.
 */
export function isUndefined(value) {
  return isEqual(typeof value, RAW_UNDEFINED);
}

/**
 * Checks if a value is empty.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean|Promise<boolean>} Returns true if the value is empty, false otherwise.
 */
export function isEmpty(value) {
  if (isNil(value)) return true;
  if (isArrayLike(value)) return !size(value);
  const type = isType(value);
  if (type === RAW_OBJECT) {
    for (const i in value) return false;
    return !size(value);
  }
  if (type === RAW_SYMBOL) {
    const desc = Object(value).description;
    if (isUndefined(desc)) return true;
    return !size(desc);
  }
  if (isPromise(value)) return value.then(v => isEmpty(v));
  return isPrimitive(value) || !size(value);
}
