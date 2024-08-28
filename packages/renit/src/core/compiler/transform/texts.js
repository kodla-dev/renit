import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { visit } from '../../../libraries/to/index.js';
import { containsCurlyBraces, parseCurlyBraces } from '../utils/curly.js';

export function texts(ast) {
  visit(ast, {
    Text: node => {
      const { content } = node;
      if (isUndefined(content)) return;

      if (!isEmpty(content)) {
        if (containsCurlyBraces(content)) {
          const parsed = parseCurlyBraces(content, 'text');
          node.content = parsed.values;
        }
      }
    },
  });
}
