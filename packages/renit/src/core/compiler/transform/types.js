import { flat, has, push, remove } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { visit } from '../../../libraries/to/index.js';
import { HTMLElements, NITElements, SVGElements } from '../utils/constant.js';
import { setNodeParam } from '../utils/index.js';
import {
  hasPrefix,
  hasSuffix,
  hasTop,
  isFragmentComponent,
  isPrefixAction,
  isPrefixBind,
  isPrefixEvent,
  isPrefixRef,
} from '../utils/node.js';

/**
 * Processes the AST to determine the type of each node.
 * @param {object} ast - The abstract syntax tree to process.
 */
export function types(ast) {
  visit(ast, {
    Element: node => {
      const { name, attributes } = node;

      // Handle script and style elements
      if (name == 'script') {
        if (hasTop(node)) return (node.type = 'TopScript');
        return (node.type = 'Script');
      }
      if (name == 'style') return (node.type = 'Style');

      if (!isEmpty(attributes)) {
        const removed = [];

        // Iterate over each attribute of the node
        for (let i = 0, n = size(attributes); i < n; i++) {
          const attribute = node.attributes[i];

          // Handle fragment components
          if (isFragmentComponent(attribute)) {
            node.type = 'Fragment';
            setNodeParam(node, 'fragment', attribute.value);
            push(i, removed);
          }

          if (hasPrefix(attribute)) {
            // Update the node type if it has a prefix indicating an event or binding.
            if (isPrefixEvent(attribute)) attribute.type = 'EventAttribute';
            if (isPrefixBind(attribute)) attribute.type = 'BindAttribute';
            if (isPrefixRef(attribute)) attribute.type = 'RefAttribute';
            if (isPrefixAction(attribute)) attribute.type = 'ActionAttribute';
          } else if (hasSuffix(attribute)) {
            attribute.type = 'ModifierAttribute';
          } else {
            if (attribute.name == '#') attribute.type = 'RefAttribute';
            if (attribute.name == '*') attribute.type = 'ActionAttribute';
          }
        }

        // Remove fragment component attributes
        const removedLen = size(removed);
        if (removedLen) {
          for (let i = 0; i < removedLen; i++) node.attributes = remove(i, attributes);
          node.attributes = flat(node.attributes);
        }
      }

      // Handle HTML, SVG and NIT elements
      if (has(name, HTMLElements) || has(name, SVGElements)) return;
      if (has(name, NITElements)) return (node.type = ucfirst(name) + 'Block');

      // Default to Component type
      return (node.type = 'Component');
    },
  });
}
