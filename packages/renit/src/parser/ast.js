/**
 * Creates and returns a TextNode object.
 * @param {string} text
 * @returns {object}
 */
export function TextNode(text) {
  return { type: 'Text', text };
}

/**
 * Creates and returns an ElementNode object with the specified properties.
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
 * Creates and returns an AttributeNode object with the specified name and value.
 * @param {string} name
 * @param {string} value
 * @returns {object}
 */
export function AttributeNode(name, value) {
  return { type: 'Attribute', name, value };
}
