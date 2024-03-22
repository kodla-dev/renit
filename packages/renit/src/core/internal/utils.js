import { DOM_REFER_SELECTOR } from '../define.js';
import { createAnchor, firstChild, lastChild, replaceWith } from './dom.js';

/**
 * Registers a property with the specified name and value on the provided object.
 * @param {Object} $ The object on which to register the property.
 * @param {string} name The name of the property.
 * @param {any} value The value of the property.
 */
export function register($, name, value) {
  Object.defineProperty($, name, {
    enumerable: false,
    configurable: true,
    get: function () {
      return value;
    },
  });
}

/**
 * Wraps the given HTML content with DOM reference selectors.
 * @param {string} html The HTML content to wrap.
 * @returns {string} The HTML content wrapped with DOM reference selectors.
 */
export function partWrapper(html) {
  return DOM_REFER_SELECTOR + html + DOM_REFER_SELECTOR;
}

/**
 * Inserts text nodes at the beginning and end of the specified HTML content for location identification.
 * @param {Element} html The HTML content.
 * @returns {Array} An array containing the text nodes inserted at the beginning and end of the HTML content.
 */
export function blockPart(html) {
  const start = createAnchor();
  const end = createAnchor();
  replaceWith(firstChild(html), start);
  replaceWith(lastChild(html), end);
  return [start, end];
}
