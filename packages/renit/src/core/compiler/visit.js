import { each, some } from '../../libraries/collect/index.js';
import { isEmpty } from '../../libraries/is/index.js';
import { isStyle } from './utils/index.js';

/**
 * Visits nodes in a tree structure, invoking the appropriate visitors function for each node type.
 * @param {object} node - The current node to visit.
 * @param {object} visitor - An object containing visitors functions for each node type.
 */
export function visit(node, visitor) {
  if (node.type in visitors) {
    visitors[node.type](node, visitor);
  }
}

/**
 * Handles the visitation of a node by invoking the appropriate visitor function.
 * @param {object} node - The node to handle.
 * @param {object} visitor - An object containing visitor functions for each node type.
 */
function handle(node, visitor) {
  if (node.type in visitor) {
    visitor[node.type](node);
  }
}

/**
 * Processes the attributes of a given AST node using a visitor pattern.
 * @param {Object} node - The AST node whose attributes are to be processed.
 * @param {Function} visitor - The visitor function to apply to each attribute.
 */
function handleAttributes(node, visitor) {
  if (!isEmpty(node.attributes)) {
    each(attribute => {
      attribute.parent = () => node;
      visit(attribute, visitor);
    }, node.attributes);
  }
}

/**
 * Processes the children of a given AST node using a visitor pattern.
 * @param {Object} node - The AST node whose children are to be processed.
 * @param {Function} visitor - The visitor function to apply to each child.
 */
function handleChildren(node, visitor) {
  if (!isEmpty(node.children)) {
    each((children, index) => {
      children.parent = () => node;
      children.parentNode = () => {
        const n = node.children[index - 1];
        if (!isEmpty(n)) return n;
        return false;
      };
      children.nextNode = () => {
        const n = node.children[index + 1];
        if (!isEmpty(n)) return n;
        return false;
      };
      children.hasStyleSheet = () => {
        return some(child => isStyle(child), children.children);
      };
      visit(children, visitor);
    }, node.children);
  }
}

/**
 * Processes the attributes and children of a given AST element node using visitor pattern.
 * @param {Object} node - The AST node to process.
 * @param {Function} visitor - The visitor function to apply to each attribute and child.
 */
function handleElement(node, visitor) {
  handleAttributes(node, visitor);
  handleChildren(node, visitor);
}

/**
 * An object containing visitor functions for each node type.
 */
const visitors = {
  Document: (node, visitor) => {
    handle(node, visitor);
    handleChildren(node, visitor);
  },
  Element: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  Fragment: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  Component: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  IfBlock: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  ElseifBlock: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  ElseBlock: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  ForBlock: (node, visitor) => {
    handle(node, visitor);
    handleElement(node, visitor);
  },
  Text: (node, visitor) => {
    handle(node, visitor);
  },
  Attribute: (node, visitor) => {
    handle(node, visitor);
  },
  Script: (node, visitor) => {
    handle(node, visitor);
  },
  Style: (node, visitor) => {
    handle(node, visitor);
  },
};
