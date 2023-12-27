import { FUNCTION } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is a function.

  @param {R} value - Value to check.
  @returns {boolean} Returns true if the value is a function, false otherwise.
  
  @example
  const func = function() {
    console.log('Hello, World!');
  };
  const result = isFunction(func);
  console.log(result); // true
*/
export function isFunction<R>(value: R): value is Include<R, CallableFunction> {
  return isEqual(typeof value, FUNCTION);
}
