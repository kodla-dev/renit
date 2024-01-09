import { ASYNC_FUNCTION } from 'renit/define';
import { isEqual } from './isEqual';
import { isFunction } from './isFunction';

/**
  Checks if the specified value is an asynchronous function.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an asynchronous function,
  false otherwise.

  @example
  const asyncFunction = async () => { ... };
  const result = isAsync(asyncFunction);
  console.log(result); // true
*/
export function isAsync<R>(value: R): value is Include<R, AsyncArrow> {
  return isFunction(value) && isEqual(value.constructor.name, ASYNC_FUNCTION);
}
