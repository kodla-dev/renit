import { parse as parseJs } from 'acorn';
import { parse as parseCss } from 'css-tree';
import { each, push } from '../../libraries/collect/index.js';
import { isEmpty, isUndefined } from '../../libraries/is/index.js';

/**
 * A list of standard HTML element names.
 *
 * This array contains the names of all standard HTML elements. It can be used
 * to verify whether a given tag name is a valid HTML element.
 *
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 12 10 12 12 12 11 11 11 11
export const HTMLElements = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big',
  'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
  'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
];

/**
 * A list of standard SVG element names.
 *
 * This array contains the names of all standard SVG elements. It can be used
 * to verify whether a given tag name is a valid SVG element.
 *
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 7 5 8 6 9
export const SVGElements = [
  'circle', 'clipPath', 'defs', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
  'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight',
  'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge',
  'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight',
  'feTile', 'feTurbulence', 'g', 'line', 'linearGradient', 'mask', 'path', 'pattern', 'polygon',
  'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text', 'tspan',
];

/**
 * A list of custom NIT (Non-Standard) element names.
 *
 * This array contains the names of custom elements used in the Renit framework.
 * These elements represent non-standard HTML elements that might be used.
 *
 * @type {string[]}
 */
export const NITElements = ['if', 'elseif', 'else', 'for'];

/**
 * Sets a parameter on a node.
 *
 * @param {object} node - The node to modify.
 * @param {string} name - The name of the parameter.
 * @param {any} value - The value of the parameter.
 */
export function setNodeParam(node, name, value) {
  if (isUndefined(node.params)) node.params = {};
  node.params[name] = value;
}

/**
 * Adds a value to a parameter array on a node.
 * @param {object} node - The node to modify.
 * @param {string} name - The name of the parameter.
 * @param {any} value - The value to add to the parameter array.
 */
export function addNodeParam(node, name, value) {
  if (isUndefined(node.params)) node.params = {};
  if (isUndefined(node.params[name])) node.params[name] = [];
  push(value, node.params[name]);
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
  return !isUndefined(node.prefix) && node.prefix == '@' && node.name == 'name';
}

/**
 * Checks if a given AST node represents an event binding.
 *
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node represents an event binding, false otherwise.
 */
export function isEventBinding(node) {
  return !isUndefined(node.prefix) && node.prefix == '@' && node.name != 'name';
}

/**
 * Converts the provided JavaScript code into an Abstract Syntax Tree (AST).
 *
 * @param {string} code The JavaScript code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the JavaScript code.
 */
export function convertJavaScriptToAST(code) {
  return parseJs(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
}

/**
 * Converts the provided CSS code into an Abstract Syntax Tree (AST).
 *
 * @param {string} code The CSS code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the CSS code.
 */
export function convertCssToAST(code) {
  return parseCss(code);
}

/**
 * Checks if the provided string contains text within curly braces.
 *
 * @param {string} input The string to check for curly braces.
 * @returns {boolean} True if the string contains text within curly braces, otherwise false.
 */
export function containsCurlyBraces(input) {
  return /{([^}]+)}/g.test(input);
}

/**
 * Splits the provided string into parts based on text within curly braces.
 *
 * @param {string} input The string to split.
 * @returns {Array} An array of strings split by curly braces.
 */
export function splitCurlyBraces(input) {
  return input.split(/({.*?})/g);
}

/**
 * Retrieves the content of curly braces in the provided string.
 *
 * @param {string} input The string to search for curly braces.
 * @returns {string|null} The content of curly braces
 */
export function getContentCurlyBraces(input) {
  return /{(.*?)}/g.exec(input)[1];
}

/**
 * Parses a string containing curly braces into an array of text and curly braces segments.
 * 
 * @param {string} nodeValue - The string to parse.
 * @param {string} [type='attr'] - The type of parsing context.
 * @returns {Object} An object containing the parsed value array and a reference flag.
 */
export function parseCurlyBraces(nodeValue, type = 'attr') {
  let values = [];
  let reference = false;

  each(part => {
    if (containsCurlyBraces(part)) {
      const content = getContentCurlyBraces(part).trim();
      push({ type: 'CurlyBraces', content }, values);
      reference = true;
    } else {
      const content = part.trim();
      if (!isEmpty(content)) {
        if (type == 'attr') part = content;
        push({ type: 'Text', content: part }, values);
      }
    }
  }, splitCurlyBraces(nodeValue));

  return { values, reference };
}
