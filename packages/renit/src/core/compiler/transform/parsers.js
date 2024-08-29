import { isEmpty } from '../../../libraries/is/index.js';
import { visit } from '../../../libraries/to/index.js';
import { javaScriptToAST } from '../utils/script.js';

export function parsers(ast) {
  visit(ast, {
    Script: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        node.content = javaScriptToAST(children.content);
        node.children = [];
      }
    },
    Style: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        node.content = children.content;
        node.children = [];
      }
    },
  });
}
