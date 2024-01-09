import { isEqual } from './isEqual';

/**
  Checks if the specified value is null.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is null, false otherwise.
  
  @example
  const nullValue = null;
  const result = isNull(nullValue);
  console.log(result); // true
*/
export function isNull<R>(value: R): value is Include<R, null> {
  return isEqual(value, null);
}
