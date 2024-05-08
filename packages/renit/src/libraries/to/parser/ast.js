/**
 * Creates and returns a textNode object.
 * @param {string} text
 * @returns {Object}
 */
export function textNode(content) {
  return { type: 'text', content };
}

/**
 * Creates and returns a commentNode object.
 * @param {string} content
 * @returns {Object}
 */
export function commentNode(content) {
  return { type: 'comment', content };
}

/**
 * Creates and returns a elementNode object.
 * @param {string} text
 * @param {boolean} voidElement
 * @param {Array} attributes
 * @param {Array} children
 * @returns {Object}
 */
export function elementNode(name = '', voidElement = false, attributes = [], children = []) {
  return { type: 'element', name, voidElement, attributes, children };
}

/**
 * Creates and returns an attributeNode object.
 * @param {string} name
 * @param {string} value
 * @returns {Object}
 */
export function attributeNode(name, value, prefix, suffix) {
  return { type: 'attribute', prefix, name, suffix, value };
}
