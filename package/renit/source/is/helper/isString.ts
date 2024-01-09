import { STRING } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is a string.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a string, false otherwise.
  
  @example
  const stringValue = 'Hello, World!';
  const result = isString(stringValue);
  console.log(result); // true
*/
export function isString<R>(value: R): value is Include<R, string> {
  return isEqual(typeof value, STRING) || value instanceof String;
}
