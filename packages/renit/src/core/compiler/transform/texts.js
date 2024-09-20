import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { visit } from '../../../libraries/to/index.js';
import { containsBraces, parseBraces } from '../utils/braces.js';
import { hasBrackets, parseMultiple } from '../utils/brackets.js';

export function texts(ast) {
  visit(ast, {
    Text: node => {
      const { content } = node;
      if (isUndefined(content)) return;

      if (!isEmpty(content)) {
        if (hasBrackets(content)) {
          const parsed = parseMultiple(content);
          node.content = parsed;
        } else if (containsBraces(content)) {
          const parsed = parseBraces(content, 'text');
          node.content = parsed.values;
        }
      }
    },
  });
}
