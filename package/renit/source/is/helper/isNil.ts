import { isNull } from './isNull';
import { isUndefined } from './isUndefined';

/**
  Checks if the specified value is null or undefined.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is null or undefined, false otherwise.
  
  @example
  const emptyValue = null;
  const result = isNil(emptyValue);
  console.log(result); // true
*/
export function isNil<R>(value: R): value is Include<R, null | undefined> {
  return isUndefined(value) || isNull(value);
}
