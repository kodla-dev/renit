import { some } from '../../../libraries/collect/index.js';
import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_WHITESPACE } from '../../define.js';

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
 * Checks if the given attribute node is a style-related attribute.
 * Style-related attributes are 'id' and 'class'.
 * @param {Object} node - The attribute node to check.
 * @param {string} node.name - The name of the attribute.
 * @returns {boolean} - Returns true if the attribute is 'id' or 'class', false otherwise.
 */
export function isStyleAttribute(node) {
  return (node || node.name) == 'id' || (node || node.name) == 'class';
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
