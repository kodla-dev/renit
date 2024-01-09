import { SYMBOL } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the specified value is a symbol.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a symbol, false otherwise.
  
  @example
  const symbolValue = Symbol('mySymbol');
  const result = isSymbol(symbolValue);
  console.log(result); // true
*/
export function isSymbol<R>(value: R): value is Include<R, symbol> {
  return isEqual(typeof value, SYMBOL);
}
