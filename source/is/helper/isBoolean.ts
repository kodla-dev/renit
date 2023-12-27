import { BOOLEAN } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is of boolean data type.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a boolean, false otherwise.

  @example
  const result = isBoolean(true);
  console.log(result); // true
*/
export function isBoolean<R>(value: R): value is Include<R, boolean> {
  return isEqual(typeof value, BOOLEAN);
}
