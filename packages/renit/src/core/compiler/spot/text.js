import { each, includes, join, push, some } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { $el, $escape, $lamb, $lambda } from '../utils/index.js';
import { isSSR } from '../utils/node.js';
import { checkDependencies } from '../utils/script.js';

/**
 * Class representing a spot for text content, with references and dependencies.
 */
export class TextSpot {
  /**
   * Creates an instance of TextSpot.
   * @param {Object} node - The node containing reference, content, and dependencies.
   * @param {string} node.reference - The reference for the text spot.
   * @param {string} node.content - The content of the text spot.
   * @param {Array} node.dependencies - The dependencies for the text spot.
   */
  constructor(node, options) {
    this.options = options;
    this.ssr = isSSR(options);
    this.reference = node.reference;
    this.content = node.content;
    this.dependencies = node.dependencies;
    this.html = node.html;
    this.parameters = [];
    this.fn = RAW_EMPTY;
  }

  /**
   * Generates the text spot code with the given updated dependencies.
   * @returns {string} - The generated code for the text spot.
   */
  generate(component) {
    const ssr = this.ssr;

    if (ssr) {
      const args = this.generateSSRArguments();
      return `$parent += ${$escape(args)};`;
    } else {
      const args = this.generateCSRArguments(component);
      return `$.${this.fn}(${args});`;
    }
  }

  /**
   * Generates the arguments for the text spot function.
   * @returns {string} - The generated arguments for the text spot function.
   */
  generateCSRArguments(component) {
    let { reference, content, dependencies, parameters, html, fn } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;
    let needDependencies = false;

    // Add node reference
    push($el(reference), parameters);

    // Check if the dependencies are updated.
    if (hasDependencies) {
      isLambda = some(dep => includes(dep, component.updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    } else {
      isLambda = checkDependencies(content, component.updatedDependencies);
    }

    // Add the content to the arguments as a lambda function.
    push($lambda(isLambda, content), parameters);

    // Add dependencies to the arguments if needed.
    if (needDependencies) each(dep => push($lamb(dep), parameters), dependencies);

    if (!isLambda) {
      fn = 'text';
      if (html) fn = 'html';
    } else {
      fn = 'Text';
      if (html) fn = 'Html';
    }

    this.fn = fn;

    return join(RAW_COMMA, parameters);
  }

  /**
   * Generates the arguments for the text spot function.
   * @returns {string} - The generated arguments for the text spot function.
   */
  generateSSRArguments() {
    let { content } = this;
    return content;
  }
}
