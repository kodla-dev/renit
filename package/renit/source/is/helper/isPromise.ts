import { isNil } from './isNil';
import { isFunction } from './isFunction';

/**
  Checks if the specified value is a promise.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a Promise, false otherwise.
  
  @example
  const promiseValue = new Promise((resolve) => {
    resolve('Completed');
  });
  const result = isPromise(promiseValue);
  console.log(result); // true
*/
export function isPromise<R>(value: R): value is Include<R, Promise<unknown>> {
  if (value instanceof Promise) return true;
  return !isNil(value) && isFunction((value as Promise<unknown>).then);
}
