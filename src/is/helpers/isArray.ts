import { Include } from '../../type';

/**
  Checks if the specified value is an array.
  @tr Belirtilen değerin bir dizi (array) olup olmadığını kontrol eder.

  @param {R} value - The value to check.
  @tr Kontrol edilecek değer.

  @returns {boolean} Returns true if the value is an array, false otherwise.
  @tr Değer bir dizi ise true, değilse false.

  @example
  const result = isArray([1, 2, 3]);
  console.log(result); // true
*/
export function isArray<R>(
  value: R
): value is Include<R, unknown[] | Readonly<unknown[]>> {
  return Array.isArray(value);
}
