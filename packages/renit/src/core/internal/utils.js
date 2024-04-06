import { isObject } from '../../libraries/is/index.js';
import { firstChild, lastChild, nextSibling, remove } from './dom.js';

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
 * Extracts the start and end nodes of a block from the provided HTML.
 * @param {HTMLElement} html The HTML element representing the block.
 * @returns {Array} An array containing the start and end nodes of the block.
 */
export function location(html) {
  let start;
  let end;
  if (html.nodeType == 11) {
    // DocumentFragment
    start = firstChild(html);
    end = lastChild(html);
  } else {
    start = end = html;
  }
  return [start, end];
}

/**
 * Iterates over a range of DOM nodes from a start node to an end node and applies a function to each node.
 * @param {Node} start - The start node of the range.
 * @param {Node} end - The end node of the range.
 * @param {Function} fn - The function to apply to each node in the range.
 */
export function eachNodes(start, end, fn) {
  let next;
  while (start) {
    next = nextSibling(start);
    fn(start);
    if (start == end) break;
    start = next;
  }
}

/**
 * Removes a range of DOM nodes from the DOM.
 * @param {Node} start - The start node of the range to be removed.
 * @param {Node} end - The end node of the range to be removed.
 */
export function removeRange(start, end) {
  eachNodes(start, end, n => remove(n));
}

/**
 * Generates a unique key for each item in an array.
 * @param {*} item - The current item in the array.
 * @param {number} index - The index of the current item.
 * @param {Array} array - The array containing the items.
 * @returns {*} The unique key for the current item.
 */
export function eachKey(item, index, array) {
  return isObject(array[0]) ? item : index;
}
