/**
	Checks if two given values are equal.

	@param {unknown} test1 - First value to compare.
	@param {unknown} test2 - Second value to compare.
	@returns {boolean} Returns true if the values are equal, false otherwise.

	@example
	const obj1 = { key: 'value' };
	const obj2 = { key: 'value' };
	const result = isEqual(obj1, obj2);
	console.log(result); // true
*/
export function isEqual(test1: unknown, test2: unknown): boolean {
  if (test1 === test2) {
    return true;
  }

  if (
    typeof test1 !== typeof test2 ||
    test1 !== Object(test1) ||
    !test1 ||
    !test2
  ) {
    return false;
  }

  return true;
}
