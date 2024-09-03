import { isEmpty } from '../../../libraries/is/index.js';
import { visit, visitFull } from '../../../libraries/to/index.js';
import { isCSR } from '../utils/node.js';
import { javaScriptClearEnv, javaScriptToAST } from '../utils/script.js';

export function parsers(ast, options) {
  visit(ast, {
    Script: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        children.content = javaScriptClearEnv(children.content, options.generate);
        node.content = javaScriptToAST(children.content);

        if (isCSR(options)) {
          // check update identifier
          visitFull(node.content, {
            Identifier(n) {
              if (n.name == '$u') {
                node.hasUpdate = true;
              }
            },
          });
        }

        node.children = [];
      }
    },
    TopScript: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        children.content = javaScriptClearEnv(children.content, options.generate);
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
