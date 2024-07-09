import { pipe } from '../../../helpers/index.js';
import { flat, has, remove } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { HTMLElements, NITElements, SVGElements } from '../utils/constant.js';
import { setNodeParam } from '../utils/index.js';
import { isFragmentComponent } from '../utils/node.js';
import { visit } from '../visit.js';

/**
 * Processes the AST to determine the type of each node.
 * @param {object} ast - The abstract syntax tree to process.
 */
export function types(ast, system) {
  visit(ast, {
    Element: node => {
      const { name, attributes } = node;

      // Handle script and style elements
      if (name == 'script') return (node.type = 'Script');
      if (name == 'style') return (node.type = 'Style');

      // Handle fragment components
      if (!isEmpty(attributes)) {
        for (let i = 0; i < size(attributes); i++) {
          const attribute = node.attributes[i];
          if (isFragmentComponent(attribute)) {
            node.type = 'Fragment';
            node.attributes = pipe(attributes, remove(i), flat);
            if (isEmpty(attribute.value)) {
              system.addError('@name cannot be left empty.', node.start);
            } else {
              setNodeParam(node, 'fragment', attribute.value);
            }
            return;
          }
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
