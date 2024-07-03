/**
 * Creates and returns a DocumentNode object.
 * @param {Array} children
 * @returns {Object}
 */
export function DocumentNode(children = []) {
  return { type: 'Document', children };
}

/**
 * Creates and returns a textNode object.
 * @param {string} text
 * @returns {Object}
 */
export function TextNode(content) {
  return { type: 'Text', content };
}

/**
 * Creates and returns a commentNode object.
 * @param {string} content
 * @returns {Object}
 */
export function CommentNode(content) {
  return { type: 'Comment', content };
}

/**
 * Creates and returns a elementNode object.
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
 * Creates and returns an attributeNode object.
 * @param {string} name
 * @param {string} value
 * @returns {Object}
 */
export function AttributeNode(name, value, prefix, suffix) {
  return { type: 'Attribute', prefix, name, suffix, value };
}
