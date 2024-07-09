import { isEmpty } from '../../../libraries/is/index.js';
import { generateJavaScript } from '../utils/script.js';

export class ScriptSpot {
  /**
   * Create a ScriptSpot.
   * @param {Object} ast - The abstract syntax tree.
   */
  constructor(ast) {
    /**
     * The abstract syntax tree.
     * @type {Object}
     */
    this.ast = ast;
  }

  /**
   * Generate JavaScript code from the AST.
   * @returns {string} The generated JavaScript code.
   */
  generate() {
    const { ast } = this;
    // Check if the body of the AST is not empty
    if (!isEmpty(ast.body)) {
      // Generate JavaScript code from the AST and trim any extra whitespace
      return generateJavaScript(ast).trim();
    }
  }
}
