/**
  Checks if the specified value is an integer.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an integer, false otherwise.
  
  @example
  const integerValue = 42;
  const result = isInteger(integerValue);
  console.log(result); // true
*/
export function isInteger<R>(value: R): value is Include<R, number> {
  return Number.isInteger(value);
}
