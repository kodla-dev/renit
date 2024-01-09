/**
  Checks if the specified value is a DOM element.

  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a DOM element or document
  fragment, false otherwise.

  @example
  const element = document.createElement('div');
  const result = isDOM(element);
  console.log(result); // true
*/
export function isDOM<R>(
  value: R
): value is Include<R, Element | DocumentFragment> {
  return value instanceof Element || value instanceof DocumentFragment;
}
