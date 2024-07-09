import { each, some } from '../../libraries/collect/index.js';
import { isArray, isEmpty, isObject } from '../../libraries/is/index.js';
import { isStyle } from './utils/node.js';

/**
 * List of AST node property names that are commonly found and should be visited.
 * @type {Array<string>}
 */
// prettier-multiline-arrays-next-line-pattern: 6
const full = [
  'children', 'body', 'params', 'expression', 'callee', 'argument',
  'arguments', 'property', 'object', 'left', 'right', 'test',
  'consequent', 'declarations', 'id', 'local', 'init', 'elements',
  'properties', 'key', 'value',
];

/**
 * Map to keep track of nodes that have been visited using the visitFull function.
 * @type {Map<Object, boolean>}
 */
const visitFullSended = new Map();

/**
 * Map to keep track of nodes that have been visited using the visitCondition function.
 * @type {Map<Object, boolean>}
 */
const visitSended = new Map();
const visitConditionSended = new Map();

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
 * Visits each child of a node using a visitor function or object with type-specific visitor functions.
 *
 * @param {Object} node - The node whose children are to be visited.
 * @param {Function|Object} visitor - The visitor function or object with type-specific visitor functions.
 */
export function visitSimple(node, visitor) {
  if (!isEmpty(node.body || node.children)) {
    each(children => {
      if (isObject(visitor)) {
        if (children.type in visitor) {
          visitor[children.type](children);
        }
      } else {
        visitor(children);
      }
    }, node.body || node.children);
  }
}

/**
 * Visits a node and its children, applying a visitor function to each.
 * @param {Object} node - The AST node to visit.
 * @param {Object|Function} visitor - The visitor function or object with functions to apply to the node.
 */
export function visitFull(node, visitor) {
  try {
    processVisitFull(node, visitor);
  } finally {
    visitFullSended.clear();
  }
}

/**
 * Processes a node and its children using a visitor function or object, ensuring each node is
 * visited only once.
 * @param {Object} node - The node to process.
 * @param {Function|Object} visitor - The visitor function or object with type-specific visitor functions.
 */
function processVisitFull(node, visitor) {
  if (!visitFullSended.has(node)) {
    if (isObject(visitor)) {
      if (node.type in visitor) {
        visitor[node.type](node);
        visitFullSended.set(node, true);
      }
    } else {
      visitor(node);
      visitFullSended.set(node, true);
    }
  }

  each(item => handleFull(node[item], visitor), full);
}

/**
 * Recursively visits a node and its children using a visitor function or object,
 * applying the visitor only if a specified condition is met.
 * Ensures each node is visited only once by clearing the visitSended map after completion.
 *
 * @param {Object} node - The node to process.
 * @param {Function|Object} visitor - The visitor function or object with type-specific visitor functions.
 * @param {Function} [condition=() => true] - A function that returns a boolean indicating whether the node should be visited.
 * @param {Array} [visited=full] - An array of keys to visit in the node.
 */
export function visitCondition(node, visitor, condition = () => true, visited = full) {
  try {
    processVisitCondition(node, visitor, condition, visited);
  } finally {
    visitSended.clear();
    visitConditionSended.clear();
  }
}

/**
 * Recursively processes a node and its children using a visitor function or object,
 * applying the visitor only if a specified condition is met and ensuring each node is visited only once.
 *
 * @param {Object} node - The node to process.
 * @param {Function|Object} visitor - The visitor function or object with type-specific visitor functions.
 * @param {Function} condition - A function that returns a boolean indicating whether the node should be visited.
 * @param {Array} visited - An array of keys to visit in the node.
 */
function processVisitCondition(node, visitor, condition, visited, parent = null) {
  if (!visitSended.has(node)) {
    if (isObject(visitor)) {
      if (node.type in visitor) {
        visitor[node.type](node, parent);
        visitSended.set(node, true);
      }
    } else {
      visitor(node, parent);
      visitSended.set(node, true);
    }
  }

  visitConditionSended.set(node, true);

  each(item => {
    if (node[item]) {
      const subnode = node[item];
      if (isArray(subnode)) {
        each(children => {
          if (!visitConditionSended.has(children)) {
            if (condition(children)) {
              processVisitCondition(children, visitor, condition, visited, node);
            }
          }
        }, subnode);
      } else if (isObject(subnode)) {
        if (!visitConditionSended.has(subnode)) {
          if (condition(subnode)) {
            processVisitCondition(subnode, visitor, condition, visited, node);
          }
        }
      }
    }
  }, visited);
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
 * Recursively visits all nodes in the AST, applying a visitor function to each.
 * @param {Object|Array} node - The AST node or array of nodes to visit.
 * @param {Function} visitor - The visitor function to apply to each node.
 */
function handleFull(node, visitor) {
  if (node) {
    if (isArray(node)) {
      each(children => processVisitFull(children, visitor), node);
    } else if (isObject(node)) {
      processVisitFull(node, visitor);
    }
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
