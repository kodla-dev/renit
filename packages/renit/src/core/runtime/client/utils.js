import {
  isArray,
  isElement,
  isFunction,
  isNil,
  isObjects,
  isText,
} from '../../../libraries/is/index.js';
import { _class } from './const.js';
import { attribute } from './static.js';

// Creates a new resolved promise.
const resolved = Promise.resolve();

// Alias for console.error to log error messages.
export const error = console.error;

/**
 * Mounts a view into a container element, either by appending it as a child or inserting it before a specific node.
 * @param {HTMLElement|Text} container The container element or text node.
 * @param {HTMLElement} view The view element to mount.
 */
export function append(container, view) {
  if (!view) return;
  if (isText(container)) {
    container.parentNode.insertBefore(view, container);
  } else {
    container.appendChild(view);
  }
}

/**
 * Replaces text nodes and elements in the HTML with anchor nodes and returns a list of references.
 * @param {HTMLElement} html The HTML element to process.
 * @returns {Array} An array of anchor nodes representing the references.
 */
export function reference(html) {
  // Create a tree walker to traverse the HTML.
  const walker = document.createTreeWalker(html, 128);

  // Initialize arrays to store nodes to replace and references.
  const replaces = [];
  const references = [];

  // Traverse the tree walker.
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const content = node.textContent;
    const next = node.nextSibling;

    // If the node's text content is 'e', replace it with the next sibling node.
    if (content == 'e') {
      replaces.push([node, next]);
    }

    // If the node's text content is 't', replace it with a newly created anchor node.
    else if (content == 't') {
      replaces.push([node, document.createTextNode('')]);
    }
  }

  // Replace nodes and build the list of references.
  for (let i = 0, n = replaces.length; i < n; ++i) {
    const e = replaces[i];
    const el = e[0];
    const target = e[1];
    if (isText(target)) {
      el.replaceWith(target);
    } else if (isElement(target)) {
      el.remove();
    }
    references.push(target);
  }

  return references;
}

/**
 * Executes a function asynchronously in the next tick of the event loop.
 * @param {Function} fn - The function to execute.
 * @returns {Promise} - A promise that resolves after the function has been executed.
 */
export function tick(fn) {
  // If a function is provided, wait for the current tick to finish before executing it
  fn && resolved.then(fn);
  // Return a resolved promise, signaling that the function has been scheduled for execution
  return resolved;
}

/**
 * Deletes an attribute from a specified element.
 * If the attribute exists as a property of the element, it is set to null.
 * Otherwise, it removes the attribute from the element.
 *
 * @param {Element} element - The element from which the attribute will be deleted.
 * @param {string} name - The name of the attribute to be deleted.
 */
function deleteAttribute(element, name) {
  if (name in element) {
    element[name] = null;
  } else {
    element.removeAttribute(name);
  }
}

/**
 * Binds an attribute to an element.
 * If the value is not null or undefined, it adds the attribute to the element.
 * Otherwise, it deletes the attribute from the element.
 *
 * @param {Element} element - The element to which the attribute will be bound.
 * @param {string} name - The name of the attribute to be bound.
 * @param {any} value - The value of the attribute to be bound. If null or undefined, the attribute is deleted.
 */
export function bindAttribute(element, name, value) {
  if (!isNil(value)) attribute(element, name, value);
  else deleteAttribute(element, name);
}

/**
 * Toggles a class on an element based on a condition.
 * If the condition is true, the class is added to the element.
 * If the condition is false, the class is removed from the element.
 *
 * @param {Element} element - The HTML element on which to toggle the class.
 * @param {boolean} condition - The condition to determine whether to add or remove the class.
 * @param {string} className - The class name to be toggled.
 */
export function toggleClass(element, condition, className) {
  const list = element.classList;
  if (condition) {
    list.add(className);
  } else {
    list.remove(className);
    if (!list.length) deleteAttribute(element, _class);
  }
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
    start = html.firstChild;
    end = html.lastChild;
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
    next = start.nextSibling;
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
  eachNodes(start, end, n => n.remove());
}

/**
 * Generates a unique key for for item in an array.
 * @param {*} item - The current item in the array.
 * @param {number} index - The index of the current item.
 * @param {Array} array - The array containing the items.
 * @returns {*} The unique key for the current item.
 */
export function forKey(item, index, array) {
  return isObjects(array[0]) ? item : index;
}

/**
 * A no-operation function that returns the input value.
 * @param {Any} a - The input value.
 * @returns {Any} The same input value.
 */
export function noop(a) {
  return a;
}

/**
 * Safely executes a callback function, catching and ignoring any errors.
 * @param {Function} callback - The callback function to execute.
 * @returns {Any} The result of the callback function, or undefined if an error occurred.
 */
export function safe(callback) {
  try {
    return callback?.();
  } catch (e) {
    error(e);
  }
}

/**
 * Safely executes a list of callback functions, catching and ignoring any errors.
 * @param {Array<Function>} list - The list of callback functions to execute.
 */
export function safeGroup(list) {
  try {
    list?.forEach(fn => fn?.());
  } catch (e) {
    error(e);
  }
}

/**
 * Safely executes a list of callback functions and collects their results.
 * If only functions are collected, the `onlyFn` parameter should be true.
 * @param {Array<Function>} list - The list of callback functions to execute.
 * @param {Array} results - The array to collect the results.
 * @param {Boolean} [onlyFn=false] - If true, only functions will be collected.
 */
export function safeMulti(list, results, onlyFn) {
  list?.forEach(callback => {
    let result = safe(callback);
    result && (!onlyFn || isFunction(result)) && results.push(result);
  });
}

/**
 * Removes an item from a list if it exists.
 * @param {Array} list - The list to remove the item from.
 * @param {Any} item - The item to remove.
 */
export function removeItem(list, item) {
  let i = list.indexOf(item);
  if (i >= 0) list.splice(i, 1);
}

/**
 * Compares two arrays for equality.

 * @param {Array} a - The first array to compare.
 * @param {Array} b - The second array to compare.
 * @returns {boolean} True if the arrays are not equal, false otherwise.
 */
export function compareArray(a, b) {
  let a0 = isArray(a);
  let a1 = isArray(b);
  if (a0 !== a1) return true;
  if (!a0) return a !== b;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}
