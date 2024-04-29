import { RAW_EMPTY } from '../define.js';

// Reference to the document object
export const Document = document;

/**
 * Creates a new element with the specified tag name.
 * @param {string} tag The tag name of the element to create.
 * @returns {Element} The newly created element.
 */
export function createElement(tag) {
  return Document.createElement(tag);
}

/**
 * Sets the inner HTML content of an element.
 * @param {Element} element The element to set the inner HTML content for.
 * @param {string} html The HTML content to set.
 */
export function innerHTML(element, html) {
  element.innerHTML = html;
}

/**
 * Creates a new element of the specified type and sets its inner HTML content.
 * @param {string} type The type of the element to create.
 * @param {string} html The HTML content to set for the element.
 * @returns {Element} The newly created element.
 */
export function innerElement(type, html) {
  let e = createElement(type);
  innerHTML(e, html);
  return e;
}

/**
 * Creates a new text node with the specified text.
 * @param {string} text The text content of the text node.
 * @returns {Text} The newly created text node.
 */
export function createTextNode(text) {
  return Document.createTextNode(text);
}

/**
 * Creates an empty anchor element.
 * @returns {Text} An empty text node.
 */
export function createAnchor() {
  return createTextNode(RAW_EMPTY);
}

/**
 * Retrieves the child nodes of the specified element.
 * @param {Element} element The element whose child nodes are to be retrieved.
 * @returns {NodeList} The list of child nodes of the element.
 */
export function childNodes(element) {
  return element.childNodes;
}

/**
 * Retrieves the first child node of the specified element.
 * @param {Element} element The element whose first child node is to be retrieved.
 * @returns {Node | null} The first child node of the element, or null if the element has no child nodes.
 */
export function firstChild(element) {
  return element.firstChild;
}

/**
 * Retrieves the last child node of the specified element.
 * @param {Element} element The element whose last child node is to be retrieved.
 * @returns {Node | null} The last child node of the element, or null if the element has no child nodes.
 */
export function lastChild(element) {
  return element.lastChild;
}

/**
 * Replaces the specified element with another element.
 * @param {Element} element The element to be replaced.
 * @param {Element} target The element to replace the specified element.
 */
export function replaceWith(element, target) {
  element.replaceWith(target);
}

/**
 * Creates a tree walker object that traverses the nodes of a subtree.
 * @param {Node} root The root node of the subtree to traverse.
 * @param {number} whatToShow A bitmask representing the types of nodes to include in the tree traversal.
 * @returns {TreeWalker} A tree walker object.
 */
export function createTreeWalker(root, whatToShow) {
  return Document.createTreeWalker(root, whatToShow);
}

/**
 * Advances the tree walker to the next node in the subtree.
 * @param {TreeWalker} walker The tree walker object.
 * @returns {Node | null} The next node in the subtree, or null if there are no more nodes.
 */
export function nextNode(walker) {
  return walker.nextNode();
}

/**
 * Retrieves the current node of the tree walker.
 * @param {TreeWalker} walker The tree walker object.
 * @returns {Node} The current node of the tree walker.
 */
export function currentNode(walker) {
  return walker.currentNode;
}

/**
 * Retrieves the next sibling node of the given node.
 * @param {Node} node The node whose next sibling node is to be retrieved.
 * @returns {Node | null} The next sibling node of the given node, or null if there is no next sibling.
 */
export function nextSibling(node) {
  return node.nextSibling;
}

/**
 * Retrieves the previous sibling node of the given node.
 * @param {Node} node The node whose previous sibling node is to be retrieved.
 * @returns {Node | null} The previous sibling node of the given node, or null if there is no previous sibling.
 */
export function previousSibling(node) {
  return node.previousSibling;
}

/**
 * Removes the given node from its parent node.
 * @param {Node} node The node to remove.
 */
export function remove(node) {
  node.remove();
}

/**
 * Appends a node as a child to the specified element.
 * @param {HTMLElement} element The element to which the node will be appended.
 * @param {Node} node The node to append as a child to the element.
 */
export function appendChild(element, node) {
  element.appendChild(node);
}

/**
 * Retrieves the parent node of the specified element.
 * @param {HTMLElement} element The element whose parent node will be retrieved.
 * @returns {Node} The parent node of the specified element.
 */
export function parentNode(element) {
  return element.parentNode;
}

/**
 * Inserts a node before a specific child node within a parent element.
 * @param {HTMLElement|Node} element The parent element where the node will be inserted.
 * @param {Node} node The node to insert.
 * @param {Node} child The child node before which the new node will be inserted.
 */
export function insertBefore(element, node, child) {
  element.insertBefore(node, child);
}

/**
 * Clones a node and optionally its descendants.
 * @param {Node} node The node to clone.
 * @param {boolean} [deep=true] A Boolean value indicating whether the descendants of the node should also be cloned.
 * @returns {Node} The cloned node.
 */
export function cloneNode(node, deep = true) {
  return node.cloneNode(deep);
}

/**
 * Replaces a child node of an element with another node.
 * @param {Node} element - The parent element.
 * @param {Node} node - The new node to replace the existing child.
 * @param {Node} child - The existing child node to be replaced.
 */
export function replaceChild(element, node, child) {
  element.replaceChild(node, child);
}

/**
 * Sets an attribute on an element.
 * @param {Element} element - The element to set the attribute on.
 * @param {string} qualifiedName - The qualified name of the attribute.
 * @param {string} value - The value to set for the attribute.
 */
export function setAttribute(element, qualifiedName, value) {
  element.setAttribute(qualifiedName, value);
}

/**
 * Adds an event listener to an element.
 * @param {Element} element - The element to add the event listener to.
 * @param {string} type - The type of event to listen for.
 * @param {EventListenerOrEventListenerObject} listener - The listener function or object to call when the event occurs.
 */
export function addEventListener(element, type, listener) {
  element.addEventListener(type, listener);
}
