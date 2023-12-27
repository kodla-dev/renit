import { isFunction } from './isFunction';

/**
  Checks if the specified collection is iterable.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is iterable, false otherwise.
  
  @example
  const iterable = [1, 2, 3];
  const result = isIterable(iterable);
  console.log(result); // true
*/
export function isIterable<R>(value: R): value is Include<R, Iterator<R>> {
  return isFunction((value as undefined)?.[Symbol.iterator]);
}
