import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { containsCurlyBraces, parseCurlyBraces } from '../utils.js';
import { visit } from '../visit.js';

/**
 * Processes the text content of an AST, parsing curly braces and updating the node content.
 * @param {Object} ast - The abstract syntax tree to process.
 */
export function texts(ast) {
  visit(ast, {
    Element: () => {},
    Fragment: () => {},
    Component: () => {},
    IfBlock: () => {},
    ElseifBlock: () => {},
    ElseBlock: () => {},
    ForBlock: () => {},
    Text: node => {
      const { content } = node;
      if (isUndefined(content)) return;

      if (!isEmpty(content)) {
        if (containsCurlyBraces(content)) {
          const parse = parseCurlyBraces(content, 'text');
          node.content = parse.values;
        }
      }
    },
  });
}
