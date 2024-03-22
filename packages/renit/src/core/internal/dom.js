import { each } from '../../libraries/collect/index.js';
import { isElement, isNull, isText } from '../../libraries/is/index.js';
import { size } from '../../libraries/math/index.js';
import { RAW_EMPTY, RAW_TEMPLATE } from '../define.js';

// Reference to the document object
export const Document = document;

// Object to cache templates
let templates = {};

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
  return document.createTreeWalker(root, whatToShow);
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
 * Creates a document fragment from the given HTML content.
 * @param {string} html The HTML content to create the fragment from.
 * @returns {DocumentFragment | Element} The document fragment containing the HTML content.
 */
export function fragment(html) {
  let content = templates[html];
  if (!content) {
    let template = innerElement(RAW_TEMPLATE, html);
    content = template.content;
    if (size(childNodes(content)) == 1) {
      content = firstChild(content);
    }
    templates[html] = content;
    return content;
  }
  return content.cloneNode(true);
}

/**
 * Replaces text nodes and elements in the HTML with anchor nodes and returns a list of references.
 * @param {HTMLElement} html The HTML element to process.
 * @returns {Array} An array of anchor nodes representing the references.
 */
export function references(html) {
  // Create a tree walker to traverse the HTML.
  const walker = createTreeWalker(html, 128);

  // Initialize arrays to store nodes to replace and references.
  const replaceNodes = [];
  const references = [];

  // Traverse the tree walker.
  while (nextNode(walker)) {
    const node = currentNode(walker);
    const next = nextSibling(node);
    const previous = previousSibling(node);

    // If the next and previous siblings are text nodes or null, replace the current node with an anchor.
    if ((isNull(next) || isText(next)) && (isNull(previous) || isText(previous))) {
      replaceNodes.push([node, createAnchor()]);
    }

    // If the next sibling is an element, replace the current node with the next sibling.
    else if (isElement(next)) {
      replaceNodes.push([node, next]);
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
  }, replaceNodes);

  return references;
}
