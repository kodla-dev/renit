import { MAX_SAFE_INTEGER } from 'renit/define';
import { isFunction } from './isFunction';
import { isNull } from './isNull';
import { isNumber } from './isNumber';

/**
  Checks if the specified value resembles an array.
  
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is array-like, false otherwise.
  
  @example
  const arrayLikeObject = { 0: 'apple', 1: 'orange', length: 2 };
  const result = isArrayLike(arrayLikeObject);
  console.log(result); // true
*/
export function isArrayLike<R>(
  value: R
): value is Include<R, ArrayLikeLiteral> {
  const len = !!value && (value as R[]).length;
  return (
    !isNull(value) &&
    !isFunction(value) &&
    isNumber(len) &&
    len > -1 &&
    len % 1 === 0 &&
    len <= MAX_SAFE_INTEGER
  );
}
