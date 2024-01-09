/**
  Checks if the specified value is an array.
  
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an array, false otherwise.

  @example
  const result = isArray([1, 2, 3]);
  console.log(result); // true
*/
export function isArray<R>(
  value: R
): value is Include<R, unknown[] | Readonly<unknown[]>> {
  return Array.isArray(value);
}
