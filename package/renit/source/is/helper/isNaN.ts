/**
  Checks if the specified value is an `NaN`.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is NaN, false otherwise.
  
  @example
  const notANumber = NaN;
  const result = isNaN(notANumber);
  console.log(result); // true
*/
export function isNaN<R>(value: R): value is Include<R, number> {
  return Number.isNaN(value);
}
