import { isEmpty } from '../../../libraries/is/index.js';
import { cssToAST, visit } from '../../../libraries/to/index.js';
import { hasEmbed, hasInline } from '../utils/node.js';
import { javaScriptToAST } from '../utils/script.js';

/**
 * Processes the AST to convert JavaScript and CSS content within Script and Style nodes.
 * @param {object} ast - The abstract syntax tree to process.
 */
export function parsers(ast) {
  visit(ast, {
    Script: node => {
      // Check if the script node is embedded
      const isEmbed = hasEmbed(node);
      if (isEmbed) node.type = 'EmbedScript';

      // Process the children of the script node if it's not embedded
      const children = node.children[0];
      if (!isEmpty(children) && !isEmbed) {
        node.content = javaScriptToAST(children.content);
        node.children = [];
      }
    },
    Style: node => {
      // Check if the style node is embedded or inline
      const isEmbed = hasEmbed(node);
      const isInline = hasInline(node);
      if (isEmbed) node.type = 'EmbedStyle';
      if (isInline) node.type = 'InlineStyle';

      // Process the children of the style node if it's not embedded
      const children = node.children[0];
      if (!isEmpty(children) && !isEmbed) {
        node.content = cssToAST(children.content);
        node.children = [];
      }
    },
  });
}
