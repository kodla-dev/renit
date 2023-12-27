import { isNumber } from './isNumber';
import { isInteger } from './isInteger';

/**
  Checks if the specified value is a floating-point number.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a floating-point number,
  false otherwise.
  
  @example
  const floatValue = 3.14;
  const result = isFloat(floatValue);
  console.log(result); // true
*/
export function isFloat<R>(value: R): value is Include<R, number> {
  return isNumber(value) && !isInteger(value);
}
