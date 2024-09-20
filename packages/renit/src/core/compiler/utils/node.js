import { each, filter, push, remove, some } from '../../../libraries/collect/index.js';
import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { length } from '../../../libraries/math/index.js';
import { RAW_WHITESPACE, RGX_WHITESPACE } from '../../define.js';

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
 * Checks if a given AST node has a prefix of '#'.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node's prefix is '#', false otherwise.
 */
export function isPrefixRef(node) {
  return node.prefix == '#';
}

/**
 * Checks if a given AST node has a prefix of '*'.
 * @param {Object} node - The AST node to check.
 * @returns {boolean} - Returns true if the node's prefix is '*', false otherwise.
 */
export function isPrefixAction(node) {
  return node.prefix == '*';
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
 * Checks if a given node has a prefix and if it matches '@name'.
 * @param {Object} node - The node object to be checked.
 * @returns {boolean} True if the node has a prefix of '@' and a name of 'name', otherwise false.
 */
export function hasAtName(node) {
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
 * Checks if a node is a UpdateExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a UpdateExpression, otherwise false.
 */
export function isUpdateExpression(node) {
  return node.type == 'UpdateExpression';
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
 * Checks if a node is a Component.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a Component, otherwise false.
 */
export function isComponent(node) {
  return node.type == 'Component';
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
 * Checks if a node is a StringText.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a StringText, otherwise false.
 */
export function isStringText(node) {
  return node.type == 'StringText';
}

/**
 * Checks if a node is a BracesAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a BracesAttribute, otherwise false.
 */
export function isBracesAttribute(node) {
  return node.type == 'BracesAttribute';
}

/**
 * Checks if a node is a BracesText.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a BracesText, otherwise false.
 */
export function isBracesText(node) {
  return node.type == 'BracesText';
}

/**
 * Checks if a node is a BlockStatement.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a BlockStatement, otherwise false.
 */
export function isBlockStatement(node) {
  return node.type == 'BlockStatement';
}

/**
 * Checks if a node is a LogicalExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a LogicalExpression, otherwise false.
 */
export function isLogicalExpression(node) {
  return node.type == 'LogicalExpression';
}

/**
 * Checks if a node is a ObjectExpression.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a ObjectExpression, otherwise false.
 */
export function isObjectExpression(node) {
  return node.type == 'ObjectExpression';
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
 * Checks if a node is a IdAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a IdAttribute, otherwise false.
 */
export function isIdAttribute(node) {
  return node.name == 'id';
}

/**
 * Checks if a node is a IdAttribute.
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns true if the node is a IdAttribute, otherwise false.
 */
export function isClassOrIdAttribute(node) {
  return isClassAttribute(node) || isIdAttribute(node);
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
 * Checks if the given node is an IfBlock.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is an IfBlock, otherwise false.
 */
export function isIfBlock(node) {
  return node.type == 'IfBlock';
}

/**
 * Checks if the given node is an ElseifBlock.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is an ElseifBlock, otherwise false.
 */
export function isElseifBlock(node) {
  return node.type == 'ElseifBlock';
}

/**
 * Checks if the given node is an ElseBlock.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is an ElseBlock, otherwise false.
 */
export function isElseBlock(node) {
  return node.type == 'ElseBlock';
}

/**
 * Checks if the given node is a ForBlock.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is a ForBlock, otherwise false.
 */
export function isForBlock(node) {
  return node.type == 'ForBlock';
}

/**
 * Checks if the given node is a ghost element.
 * A ghost element can be a text node, if block, or for block.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is a ghost element, otherwise false.
 */
export function isGhostElement(node) {
  return (
    (isTextNode(node) && !RGX_WHITESPACE.test(node.content)) || isIfBlock(node) || isForBlock(node)
  );
}

/**
 * Checks if an HTML node is an invisible element.
 *
 * @param {Object} node - The HTML node to check.
 * @returns {boolean} True if the node is a invisible.
 */
export function isInvisibleElement(node) {
  return isScript(node) || isStyle(node) || isFragment(node);
}

/**
 * Checks if the given node is a markup element.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node is a markup element, otherwise false.
 */
export function isMarkupElement(node) {
  return isElementNode(node) || isGhostElement(node);
}

/**
 * Checks if the node is of type 'Attribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is an attribute, otherwise `false`.
 */
export function isAttribute(node) {
  return node.type == 'Attribute';
}

/**
 * Checks if the node is of type 'EventAttribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is an event attribute, otherwise `false`.
 */
export function isEventAttribute(node) {
  return node.type == 'EventAttribute';
}

/**
 * Checks if the node is of type 'BindAttribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a bind attribute, otherwise `false`.
 */
export function isBindAttribute(node) {
  return node.type == 'BindAttribute';
}

/**
 * Checks if the node is of type 'ModifierAttribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a modifier attribute, otherwise `false`.
 */
export function isModifierAttribute(node) {
  return node.type == 'ModifierAttribute';
}

/**
 * Checks if the node is of type 'RefAttribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a modifier attribute, otherwise `false`.
 */
export function isRefAttribute(node) {
  return node.type == 'RefAttribute';
}

/**
 * Checks if the node is of type 'ActionAttribute'.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a modifier attribute, otherwise `false`.
 */
export function isActionAttribute(node) {
  return node.type == 'ActionAttribute';
}

/**
 * Checks if the node is a prefix attribute.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a prefix attribute, otherwise `false`.
 */
export function isPrefixAttribute(node) {
  return isEventAttribute(node) || isBindAttribute(node);
}

/**
 * Checks if the node is a special attribute.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node is a special attribute, otherwise `false`.
 */
export function isSpecialAttribute(node) {
  return isPrefixAttribute(node) || isModifierAttribute(node);
}

/**
 * Checks if the given option is set to generate server-side rendered (SSR) output.
 *
 * @param {Object} opt - The options object.
 * @param {string} opt.generate - The generation mode, e.g., 'ssr' or 'csr'.
 * @returns {boolean} - Returns `true` if the `generate` property is set to 'ssr', otherwise `false`.
 */
export function isSSR(opt) {
  const name = 'ssr';
  if (opt.generate == name) {
    return true;
  } else if (opt.name == name) {
    return true;
  } else if (opt.params) {
    if (opt.params.generate == name) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the given option is set to generate client-side rendered (CSR) output.
 *
 * @param {Object} opt - The options object.
 * @param {string} opt.generate - The generation mode, e.g., 'ssr' or 'csr'.
 * @returns {boolean} - Returns `true` if the `generate` property is set to 'csr', otherwise `false`.
 */
export function isCSR(opt) {
  const name = 'csr';
  if (opt.generate == name) {
    return true;
  } else if (opt.name == name) {
    return true;
  } else if (opt.params) {
    if (opt.params.generate == name) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a given node has an `ssr` attribute.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node has an `ssr` attribute, otherwise `false`.
 */
export function hasSSR(node) {
  return hasAttributes(node) && some(attribute => attribute.name == 'ssr', node.attributes);
}

/**
 * Checks if a given node has an `csr` attribute.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node has an `csr` attribute, otherwise `false`.
 */
export function hasCSR(node) {
  return hasAttributes(node) && some(attribute => attribute.name == 'csr', node.attributes);
}

/**
 * Checks if a given node has an `top` attribute.
 *
 * @param {Object} node - The node to check.
 * @returns {boolean} - Returns `true` if the node has an `ssr` attribute, otherwise `false`.
 */
export function hasTop(node) {
  return hasAttributes(node) && some(attribute => attribute.name == 'top', node.attributes);
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

/**
 * Trims children nodes of invisible elements and their adjacent whitespace text nodes.
 *
 * @param {Object} node - The parent node whose children need to be trimmed.
 */
export function nodeChildrenTrim(node) {
  // Array to store indexes of nodes to be removed
  const removeIndexes = [];
  each((child, index) => {
    if (isInvisibleElement(child)) {
      const prevIndex = index - 1;
      const nextIndex = index + 1;

      const prev = node.children[prevIndex];
      const next = node.children[nextIndex];

      // Check if the previous sibling is a whitespace text node
      if (prev && !isFragment(child)) {
        if (RGX_WHITESPACE.test(prev.content)) {
          push(prevIndex, removeIndexes);
        }
      }

      // Check if the next sibling is a whitespace text node
      if (next) {
        if (RGX_WHITESPACE.test(next.content)) {
          push(nextIndex, removeIndexes);
        }
      }
    }
  }, node.children);

  // Remove the nodes marked for removal
  each(r => remove(r, node.children), removeIndexes);

  // Filter out null or undefined nodes from the children array
  node.children = filter(node.children);
}

/**
 * Trims whitespace from the start and end of an SSR block.
 * If the block has more than one element, trims the last and first elements.
 * Recursively removes empty or whitespace-only elements at the end of the block.
 * @param {Array<string>} block - The SSR block to be trimmed.
 * @returns {Array<string>} The trimmed SSR block.
 */
export function ssrBlockTrim(block) {
  const len = length(block);

  // If the block has more than one element, process trimming.
  if (len > 1) {
    const _1 = len - 1;

    // If the last element is empty or only whitespace, remove it and recursively trim.
    if (isEmpty(block[_1]) || RGX_WHITESPACE.test(block[_1])) {
      block.pop();
      block = ssrBlockTrim(block);
    } else {
      // Trim the end of the last element and the start of the first element.
      block[_1] = block[_1].trimEnd();
      block[0] = block[0].trimStart();
    }
  } else {
    // If the block has only one element, trim it entirely.
    block[0] = block[0].trim();
    if (isEmpty(block[0]) || RGX_WHITESPACE.test(block[0])) {
      block.pop();
    }
  }
  return block;
}
