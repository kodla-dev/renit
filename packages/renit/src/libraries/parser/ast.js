/**
 * Creates and returns a TextNode object.
 * @param {string} text
 * @returns {object}
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
 * @returns {object}
 */
export function ElementNode(name = '', voidElement = false, attributes = [], children = []) {
  return { type: 'Element', name, voidElement, attributes, children };
}

/**
 * Creates and returns an AttributeNode object.
 * @param {string} name
 * @param {string} value
 * @returns {object}
 */
export function AttributeNode(name, value) {
  return { type: 'Attribute', name, value };
}
