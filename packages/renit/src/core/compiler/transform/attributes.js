import { isEmpty } from '../../../libraries/is/index.js';
import { containsCurlyBraces, parseCurlyBraces } from '../utils/curly.js';
import { setNodeParam } from '../utils/index.js';
import { hasPrefix, isPrefixBind, isPrefixEvent } from '../utils/node.js';
import { visit } from '../visit.js';

/**
 * Processes and transforms attributes within the AST.
 *
 * This function visits each attribute node in the AST, performing transformations such as
 * handling curly brace syntax, setting reference parameters, and removing empty attributes.
 *
 * @param {Object} ast - The abstract syntax tree (AST) to process.
 */
export function attributes(ast) {
  visit(ast, {
    Attribute: node => {
      let value = node.value;
      let hasParentReference = false;
      const hasPrefixFlag = hasPrefix(node);

      // Handle empty values by setting them to a default value based on the node's name.
      if (isEmpty(value)) {
        if (hasPrefixFlag) {
          node.value = value = `{${node.name}}`;
        }
      }

      // Process non-empty values.
      if (!isEmpty(value)) {
        // Parse values containing curly braces and set the node's value.
        if (containsCurlyBraces(value)) {
          const parsed = parseCurlyBraces(value, 'attribute');
          node.value = parsed.values;
          hasParentReference = parsed.reference;
        }
      }

      // Update the node type if it has a prefix indicating an event or binding.
      if (hasPrefixFlag) {
        if (isPrefixEvent(node)) node.type = 'EventAttribute';
        if (isPrefixBind(node)) node.type = 'BindAttribute';
        hasParentReference = true;
      }

      // If the value contains a reference, set the parent node's reference parameter.
      if (hasParentReference) {
        const parent = node.parent();
        setNodeParam(parent, 'reference', true);
      }
    },
  });
}
