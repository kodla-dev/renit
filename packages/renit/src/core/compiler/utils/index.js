import { join } from '../../../libraries/collect/index.js';
import { isArray, isUndefined } from '../../../libraries/is/index.js';
import { RAW_COMMA, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';

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
 * Creates a lambda function string with specified content and parameters.
 *
 * @param {string} content - The content of the lambda function.
 * @param {string[]|string} parameters - The parameters of the lambda function.
 * @returns {string} - The lambda function string.
 */
export function $lamb(content, parameters = RAW_EMPTY) {
  if (isArray(parameters)) parameters = join(RAW_COMMA, parameters);
  return `(${parameters}) => ${content}`;
}

/**
 * Generates a lambda function or returns the content directly based on the isLambda flag.
 *
 * @param {boolean} isLambda - Flag indicating whether to generate a lambda function.
 * @param {string} content - The content to be used in the lambda function or returned directly.
 * @param {string} [parameters=''] - The parameters for the lambda function (optional).
 * @returns {string} - The generated lambda function or the original content.
 */
export function $lambda(isLambda, content, parameters = RAW_EMPTY) {
  if (isLambda) {
    return $lamb(content, parameters);
  } else {
    return content;
  }
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

/**
 * Compacts a given string by removing extra whitespace and newlines.
 * @param {string} value - The string to compact.
 * @returns {string} - The compacted string.
 */
export function compact(value) {
  return value
    .trim()
    .replaceAll('\n', RAW_EMPTY)
    .replace(/\s{2,}/g, RAW_WHITESPACE)
    .trim();
}

/**
 * Maps certain attribute names to their corresponding internal representations.
 *
 * @param {string} name - The name of the attribute to map.
 * @returns {string} - The internal representation of the attribute name,
 * or the original name if no mapping exists.
 */
export function adaptDefine(name) {
  // prettier-ignore
  switch (name) {
    case 'checked': return '$._checked';
    case 'click': return '$._click';
    case 'value': return '$._value';
    case 'class': return '$._class';
    case 'style': return '$._style';
    default: return $str(name);
  }
}

/**
 * Generate a unique ID based on the current timestamp and a random factor.
 * @returns {string} The generated unique ID.
 */
export function generateId() {
  // Generate an ID based on the current timestamp and a random factor
  let id = Math.floor(Date.now() * Math.random()).toString(36);
  // Ensure the ID is not longer than 6 characters
  if (id.length > 6) id = id.substring(id.length - 6);
  return id;
}
