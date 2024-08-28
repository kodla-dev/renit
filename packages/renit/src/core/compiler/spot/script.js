import { push, unique } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { isSSR } from '../utils/node.js';
import { prepareScript } from '../utils/script.js';

export class ScriptSpot {
  /**
   * Create a ScriptSpot.
   * @param {Object} ast - The abstract syntax tree.
   */
  constructor(ast, options) {
    /**
     * The abstract syntax tree.
     * @type {Object}
     */
    this.ast = ast;
    this.ssr = isSSR(options);
  }

  /**
   * Generate JavaScript code from the AST.
   * @returns {string} The generated JavaScript code.
   */
  generate(component) {
    const { ast } = this;
    // Check if the body of the AST is not empty
    if (!isEmpty(ast.body)) {
      // Generate JavaScript code
      const preparedScript = prepareScript(
        ast,
        component.dependencies,
        component.changedStyles,
        this.ssr
      );

      if (!isEmpty(prepareScript.functionNames)) {
        push(prepareScript.functionNames, 1, component.functionNames);
      }

      if (preparedScript.hasUpdatedDependencies) {
        push(preparedScript.updatedDependencies, 1, component.updatedDependencies);
        component.updatedDependencies = unique(component.updatedDependencies);
      }

      return preparedScript.raw.trim();
    }
  }
}
