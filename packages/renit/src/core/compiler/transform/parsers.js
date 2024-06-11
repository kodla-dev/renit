import { isEmpty } from '../../../libraries/is/index.js';
import { convertCssToAST, convertJavaScriptToAST } from '../utils.js';
import { visit } from '../visit.js';

/**
 * Processes the AST to convert JavaScript and CSS content within Script and Style nodes.
 * @param {object} ast - The abstract syntax tree to process.
 */
export function parsers(ast) {
  visit(ast, {
    Script: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        node.content = convertJavaScriptToAST(children.content);
        node.children = [];
      }
    },
    Style: node => {
      const children = node.children[0];
      if (!isEmpty(children)) {
        node.content = convertCssToAST(children.content);
        node.children = [];
      }
    },
  });
}
