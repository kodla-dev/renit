import { isEqual } from './isEqual';

/**
  Checks if the specified value is a regular expression.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a regular expression,
  false otherwise.
  
  @example
  const regexValue = /test/;
  const result = isRegExp(regexValue);
  console.log(result); // true
*/
export function isRegExp<R>(value: R): value is Include<R, RegExp> {
  return (
    value instanceof RegExp ||
    isEqual(Object.prototype.toString.call(value), '[object RegExp]')
  );
}
