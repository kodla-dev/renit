import { isUndefined } from '../../../libraries/is/index.js';
import { RAW_EMPTY } from '../../define.js';

/**
 * Converts a given value to a string format enclosed in single quotes.
 * @param {string} value - The value to be converted.
 * @returns {string} - The value enclosed in single quotes.
 */
export function $str(value) {
  return `"${value}"`;
}

/**
 * Converts a given value to a template literal string.
 * @param {string} value - The value to be converted.
 * @returns {string} - The value enclosed in backticks as a template literal.
 */
export function $ltr(value) {
  return `\`${value}\``;
}

/**
 * Converts a given value to a template literal variable format.
 * @param {string} value - The value to be converted.
 * @returns {string} - The value enclosed in `${}` for template literals.
 */
export function $var(value) {
  return '${' + value + '}';
}

/**
 * Converts a given reference to an element reference string format.
 *
 * @param {string} reference - The reference to be converted.
 * @returns {string} - The reference prefixed with `$el`.
 */
export function $el(reference) {
  return `$el${reference}`;
}

/**
 * Generates a string representing an update function call with optional parameters.
 * @param {string} parameters - The parameters to be passed to the update function.
 * @param {boolean} close - Whether to add a semicolon at the end of the string.
 * @returns {string} The generated update function call string.
 */
export function $u(parameters = RAW_EMPTY, close = true) {
  let src = `$u(${parameters})`;
  if (close) src += ';';
  return src;
}

/**
 * Sets a parameter on a node.
 * @param {object} node - The node to modify.
 * @param {string} name - The name of the parameter.
 * @param {any} value - The value of the parameter.
 */
export function setNodeParam(node, name, value) {
  if (isUndefined(node.params)) node.params = {};
  node.params[name] = value;
}
