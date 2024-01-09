import { UNDEFINED } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is undefined.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is undefined, false otherwise.
  
  @example
  let undefinedValue;
  const result = isUndefined(undefinedValue);
  console.log(result); // true
*/
export function isUndefined<R>(value: R): value is Include<R, undefined> {
  return isEqual(typeof value, UNDEFINED);
}
