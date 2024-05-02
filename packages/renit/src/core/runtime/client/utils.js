import { clone } from '../../../helpers/index.js';
import { each } from '../../../libraries/collect/index.js';
import { isArray, isElement, isEqual, isNull, isObject, isText } from '../../../libraries/is/index.js';
import {
  appendChild,
  createAnchor,
  createTreeWalker,
  currentNode,
  firstChild,
  insertBefore,
  lastChild,
  nextNode,
  nextSibling,
  parentNode,
  previousSibling,
  remove,
  replaceWith,
} from './dom.js';

// Creates a new resolved promise.
const resolved = Promise.resolve();

/**
 * Mounts a view into a container element, either by appending it as a child or inserting it before a specific node.
 * @param {HTMLElement|Text} container The container element or text node.
 * @param {HTMLElement} view The view element to mount.
 */
export function mount(container, view) {
  if (!view) return;
  if (isText(container)) {
    insertBefore(parentNode(container), view, container);
  } else {
    appendChild(container, view);
  }
}

/**
 * Replaces text nodes and elements in the HTML with anchor nodes and returns a list of references.
 * @param {HTMLElement} html The HTML element to process.
 * @returns {Array} An array of anchor nodes representing the references.
 */
export function reference(html) {
  // Create a tree walker to traverse the HTML.
  const walker = createTreeWalker(html, 128);

  // Initialize arrays to store nodes to replace and references.
  const replaces = [];
  const references = [];

  // Traverse the tree walker.
  while (nextNode(walker)) {
    const node = currentNode(walker);
    const next = nextSibling(node);
    const previous = previousSibling(node);

    // If the next and previous siblings are text nodes or null, replace the current node with an anchor.
    if ((isNull(next) || isText(next)) && (isNull(previous) || isText(previous))) {
      replaces.push([node, createAnchor()]);
    }

    // If the next sibling is an element, replace the current node with the next sibling.
    else if (isElement(next)) {
      replaces.push([node, next]);
    }
  }

  // Replace nodes and build the list of references.
  each(e => {
    const el = e[0];
    const target = e[1];

    if (isText(target)) {
      replaceWith(el, target);
    } else if (isElement(target)) {
      remove(el);
    }

    references.push(target);
  }, replaces);

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

/**
 * Executes callback functions for each item in the watch list if the value returned by the
 * associated reactive function has changed.
 * @param {Array} watchList - The list of watch objects containing reactive functions and their
 * corresponding callbacks.
 */
export function digest(watchList) {
  each(watch => {
    let value = watch.fn();
    if (!isEqual(watch.v, value)) {
      watch.cb(value);
      if (isArray(value)) value = clone(value);
      watch.v = value;
    }
  }, watchList);
}
