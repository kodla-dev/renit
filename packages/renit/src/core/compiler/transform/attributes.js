import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { containsCurlyBraces, isEventBinding, parseCurlyBraces, setNodeParam } from '../utils.js';
import { visit } from '../visit.js';

/**
 * Processes the attributes of an AST, parsing curly braces and setting reference flags.
 * @param {Object} ast - The abstract syntax tree to process.
 */
export function attributes(ast) {
  visit(ast, {
    Element: () => {},
    Fragment: () => {},
    Component: () => {},
    IfBlock: () => {},
    ElseifBlock: () => {},
    ElseBlock: () => {},
    ForBlock: () => {},
    Attribute: node => {
      const { value } = node;
      let parentReference = false;

      if (isUndefined(value)) return;

      if (!isEmpty(value)) {
        if (containsCurlyBraces(value)) {
          const parse = parseCurlyBraces(value);
          node.value = parse.values;
          parentReference = parse.reference;
        }

        if (parentReference || isEventBinding(node)) {
          const parent = node.parent();
          setNodeParam(parent, 'reference', true);
        }
      }
    },
  });
}
