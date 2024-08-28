import { flat, has, push, remove } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { visit } from '../../../libraries/to/index.js';
import { HTMLElements, NITElements, SVGElements } from '../utils/constant.js';
import { setNodeParam } from '../utils/index.js';
import {
  hasCSR,
  hasPrefix,
  hasSSR,
  hasSuffix,
  isCSR,
  isFragmentComponent,
  isPrefixBind,
  isPrefixEvent,
  isSSR,
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
        if (hasSSR(node)) {
          setNodeParam(node, 'generate', 'ssr');
        } else if (hasCSR(node)) {
          setNodeParam(node, 'generate', 'csr');
        }
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
          } else if (hasSuffix(attribute)) {
            attribute.type = 'ModifierAttribute';
          }

          if (isSSR(attribute)) {
            setNodeParam(node, 'generate', 'ssr');
          } else if (isCSR(attribute)) {
            setNodeParam(node, 'generate', 'csr');
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
