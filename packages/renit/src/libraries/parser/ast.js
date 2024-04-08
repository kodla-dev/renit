/**
 * Creates and returns a TextNode object.
 * @param {string} text
 * @returns {Object}
 */
export function TextNode(text) {
  return { type: 'Text', text };
}

/**
 * Creates and returns a CommentNode object.
 * @param {string} comment
 * @returns {Object}
 */
export function CommentNode(comment) {
  return { type: 'Comment', comment };
}

/**
 * Creates and returns a ElementNode object.
 * @param {string} text
 * @param {boolean} voidElement
 * @param {Array} attributes
 * @param {Array} children
 * @returns {Object}
 */
export function ElementNode(name = '', voidElement = false, attributes = [], children = []) {
  return { type: 'Element', name, voidElement, attributes, children };
}

/**
 * Creates and returns an AttributeNode object.
 * @param {string} name
 * @param {string} value
 * @returns {Object}
 */
export function AttributeNode(name, value, prefix, suffix) {
  return { type: 'Attribute', prefix, name, suffix, value };
}
