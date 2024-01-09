import { NUMBER } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is a number.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a number, false otherwise.
  
  @example
  const numericValue = 42;
  const result = isNumber(numericValue);
  console.log(result); // true
*/
export function isNumber<R>(value: R): value is Include<R, number> {
  return isEqual(typeof value, NUMBER);
}
