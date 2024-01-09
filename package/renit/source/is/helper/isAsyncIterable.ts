import { isFunction } from './isFunction';

/**
  Checks if the specified value is an asynchronous iterable.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an asynchronous iterable,
	false otherwise.

  @example
  const asyncIterable = {
    [Symbol.asyncIterator]: async function* () {
      yield 1;
      yield 2;
      yield 3;
    },
  };
  const result = isAsyncIterable(asyncIterable);
  console.log(result); // true
*/
export function isAsyncIterable<R>(
  value: R
): value is Include<R, AsyncIterator<R>> {
  return isFunction((value as undefined)?.[Symbol.asyncIterator]);
}
