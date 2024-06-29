import { join, some } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_COMMA, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { uniqueStyleHash } from './hash.js';

// Generates unique short class names for styling
const styleHash = new uniqueStyleHash();

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
 * A pattern representing an empty Program node in an AST.
 * @type {Object}
 */
export const ProgramPattern = {
  type: 'Program',
  body: [],
};

/**
 * Pattern for a div element node.
 * @type {Object}
 */
export const ElementDivPattern = {
  type: 'Element',
  name: 'div',
  voidElement: false,
  attributes: [],
  children: [],
};

/**
 * Pattern for an attribute node.
 * @type {Object}
 */
export const AttributePattern = {
  type: 'Attribute',
  prefix: undefined,
  name: '',
  suffix: undefined,
  value: '',
};

/**
 * Pattern for a string attribute node.
 * @type {Object}
 */
export const StringAttributePattern = {
  type: 'StringAttribute',
  content: '',
};

/**
 * Pattern for a raw node.
 * @type {Object}
 */
export const RawPattern = {
  type: 'Raw',
  loc: null,
  value: '',
};

/**
 * Constant representing the string '$event'.
 * @type {string}
 */
export const $event = '$event';

/**
 * Constant representing the string '$element'.
 * @type {string}
 */
export const $element = '$element';

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
 * Checks if a given AST node has a prefix.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node has a prefix, false otherwise.
 */
export function hasPrefix(node) {
  return !isUndefined(node.prefix);
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

/**
 * Checks if a given AST node has a prefix of '|'.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node's prefix is '|', false otherwise.
 */
export function isPrefixLine(node) {
  return node.prefix == '|';
}

/**
 * Checks if a given AST node has a suffix.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node has a suffix, false otherwise.
 */
export function hasSuffix(node) {
  return !isUndefined(node.suffix);
}

/**
 * Checks if a given node has attributes.
 * @param {Object} node - The node to check for attributes.
 * @returns {boolean} - Returns true if the node has attributes, otherwise false.
 */
export function hasAttributes(node) {
  return !isEmpty(node.attributes);
}

/**
 * Checks if a given node has an 'embed' attribute.
 * @param {Object} node - The node to check for the 'embed' attribute.
 * @returns {boolean} - Returns true if the node has an 'embed' attribute, otherwise false.
 */
export function hasEmbed(node) {
  return hasAttributes(node) && some(attribute => attribute.name == 'embed', node.attributes);
}

/**
 * Checks if a given node has an 'inline' attribute.
 * @param {Object} node - The node to check for the 'inline' attribute.
 * @returns {boolean} - Returns true if the node has an 'inline' attribute, otherwise false.
 */
export function hasInline(node) {
  return hasAttributes(node) && some(attribute => attribute.name == 'inline', node.attributes);
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
 * Checks if a node is an Identifier.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is an Identifier, otherwise false.
 */
export function isIdentifier(node) {
  return node.type == 'Identifier';
}

/**
 * Checks if a node is a MemberExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a MemberExpression, otherwise false.
 */
export function isMemberExpression(node) {
  return node.type == 'MemberExpression';
}

/**
 * Checks if a node is a ExpressionStatement.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ExpressionStatement, otherwise false.
 */
export function isExpressionStatement(node) {
  return node.type == 'ExpressionStatement';
}

/**
 * Checks if a node is a SequenceExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a SequenceExpression, otherwise false.
 */
export function isSequenceExpression(node) {
  return node.type == 'SequenceExpression';
}

/**
 * Checks if a node is a ArrowFunctionExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ArrowFunctionExpression, otherwise false.
 */
export function isArrowFunctionExpression(node) {
  return node.type == 'ArrowFunctionExpression';
}

/**
 * Checks if a node is a FunctionExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a FunctionExpression, otherwise false.
 */
export function isFunctionExpression(node) {
  return node.type == 'FunctionExpression';
}

/**
 * Checks if a node is a AssignmentExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a AssignmentExpression, otherwise false.
 */
export function isAssignmentExpression(node) {
  return node.type == 'AssignmentExpression';
}

/**
 * Checks if a node is a CallExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a CallExpression, otherwise false.
 */
export function isCallExpression(node) {
  return node.type == 'CallExpression';
}

/**
 * Checks if a node is a FunctionDeclaration.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a FunctionDeclaration, otherwise false.
 */
export function isFunctionDeclaration(node) {
  return node.type == 'FunctionDeclaration';
}

/**
 * Checks if a node is a ImportDeclaration.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ImportDeclaration, otherwise false.
 */
export function isImportDeclaration(node) {
  return node.type == 'ImportDeclaration';
}

/**
 * Checks if a node is a ExportNamedDeclaration.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ExportNamedDeclaration, otherwise false.
 */
export function isExportNamedDeclaration(node) {
  return node.type == 'ExportNamedDeclaration';
}

/**
 * Check if a node is a selector.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is a selector, false otherwise.
 */
export function isSelector(node) {
  return node.type == 'Selector';
}

/**
 * Checks if a node is a Document.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Document, otherwise false.
 */
export function isDocument(node) {
  return node.type == 'Document';
}

/**
 * Checks if a node is a Fragment.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Fragment, otherwise false.
 */
export function isFragment(node) {
  return node.type == 'Fragment';
}

/**
 * Checks if a node is a Element.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Element, otherwise false.
 */
export function isElementNode(node) {
  return node.type == 'Element';
}

/**
 * Checks if a node is a Text.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Text, otherwise false.
 */
export function isTextNode(node) {
  return node.type == 'Text';
}

/**
 * Checks if a node is a Style.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Style, otherwise false.
 */
export function isStyle(node) {
  return node.type == 'Style';
}

/**
 * Checks if a node is a Script.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Script, otherwise false.
 */
export function isScript(node) {
  return node.type == 'Script';
}

/**
 * Checks if a node is a ClassSelector.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ClassSelector, otherwise false.
 */
export function isClassSelector(node) {
  return node.type == 'ClassSelector';
}

/**
 * Checks if a node is a IdSelector.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a IdSelector, otherwise false.
 */
export function isIdSelector(node) {
  return node.type == 'IdSelector';
}

/**
 * Checks if a node is a PseudoClassSelector.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a PseudoClassSelector, otherwise false.
 */
export function isPseudoClassSelector(node) {
  return node.type == 'PseudoClassSelector';
}

/**
 * Checks if a node is a Literal.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Literal, otherwise false.
 */
export function isLiteral(node) {
  return node.type == 'Literal';
}

/**
 * Checks if a node is a StringAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a StringAttribute, otherwise false.
 */
export function isStringAttribute(node) {
  return node.type == 'StringAttribute';
}

/**
 * Checks if a node is a CurlyBracesAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a CurlyBracesAttribute, otherwise false.
 */
export function isCurlyBracesAttribute(node) {
  return node.type == 'CurlyBracesAttribute';
}

/**
 * Checks if a node is a ClassAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ClassAttribute, otherwise false.
 */
export function isClassAttribute(node) {
  return node.name == 'class';
}

/**
 * Checks if a node's name is a dollar sign ('$').
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node's name is '$', otherwise false.
 */
export function isDollarSign(node) {
  return node.name == '$';
}

/**
 * Retrieves the expressions from a given node.
 * @param {Object} node - The node from which to retrieve expressions.
 * @returns {Array} - An array of expressions from the node.
 */
export function getExpressions(node) {
  return node.expressions;
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
 * Generates a lambda function or returns the content directly based on the isLambda flag.
 *
 * @param {boolean} isLambda - Flag indicating whether to generate a lambda function.
 * @param {string} content - The content to be used in the lambda function or returned directly.
 * @param {string} [parameters=''] - The parameters for the lambda function (optional).
 * @returns {string} - The generated lambda function or the original content.
 */
export function lambda(isLambda, content, parameters = RAW_EMPTY) {
  if (isLambda) {
    return $lamb(content, parameters);
  } else {
    return content;
  }
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
 * Compacts the text content of a node by trimming unnecessary whitespace based on its context.
 * @param {Object} node - The text node to be compacted.
 * @returns {string} The compacted text content.
 */
export function compactTextNode(node) {
  const parentNode = node.parentNode();
  const nextNode = node.nextNode();
  let content = node.content;

  // Trim start of content if the node has no parent
  if (!parentNode) content = content.trimStart();

  // Handle whitespace at the start of content
  if (content.trimStart() != content && (isStyle(parentNode) || isScript(parentNode))) {
    content = content.trimStart();
  } else if (content.trimStart() != content && !isTextNode(parentNode)) {
    content = RAW_WHITESPACE + content.trimStart();
  }

  // Handle whitespace at the end of content
  if (content.trimEnd() != content && (isStyle(nextNode) || isScript(nextNode))) {
    content = content.trimEnd();
  } else if (content.trimEnd() != content && !isTextNode(nextNode)) {
    content = content.trimEnd() + RAW_WHITESPACE;
  }

  // Trim end of content if the node has no next sibling
  if (!nextNode) content = content.trimEnd();

  return content;
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

/**
 * Generate a unique style hash with specified minimum and maximum lengths.
 * @param {number} min - The minimum length of the hash.
 * @param {number} max - The maximum length of the hash.
 * @returns {string} The generated style hash.
 */
export function generateStyleHash(min, max) {
  styleHash.setMin(min);
  styleHash.setMax(max);
  return styleHash.create(generateId());
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
