import { isUndefined } from '../../../libraries/is/index.js';

/**
 * Checks if a given AST node has a prefix.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node has a prefix, false otherwise.
 */
export function hasPrefix(node) {
  return !isUndefined(node.prefix);
}

/**
 * Checks if the given node is a fragment component.
 *
 * A fragment component is identified by having a prefix of '@' and a name of 'name'.
 *
 * @param {object} node The node to check.
 * @returns {boolean} True if the node is a fragment component, otherwise false.
 */
export function isFragmentComponent(node) {
  return hasPrefix(node) && node.prefix == '@' && node.name == 'name';
}

/**
 * Checks if a given AST node has a prefix of ':'.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node's prefix is ':', false otherwise.
 */
export function isPrefixBind(node) {
  return node.prefix == ':';
}

/**
 * Checks if a given AST node has a prefix of '@'.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node's prefix is '@', false otherwise.
 */
export function isPrefixEvent(node) {
  return node.prefix == '@';
}
