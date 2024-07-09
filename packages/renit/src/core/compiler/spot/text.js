import { each, has, includes, join, push, some } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { RAW_COMMA } from '../../define.js';
import { $el, $lamb, $lambda } from '../utils/index.js';

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
  constructor(node) {
    this.reference = node.reference;
    this.content = node.content;
    this.dependencies = node.dependencies;
    this.html = node.html;
    this.parameters = ['$t'];
  }

  /**
   * Generates the text spot code with the given updated dependencies.
   * @param {Array} updatedDependencies - The updated dependencies to consider.
   * @returns {string} - The generated code for the text spot.
   */
  generate({ updatedDependencies }) {
    let spot = 'text';
    if (this.html) spot = 'html';

    return `$.${spot}(${this.generateArguments(updatedDependencies)});`;
  }

  /**
   * Generates the arguments for the text spot function.
   * @param {Array} updatedDependencies - The updated dependencies to consider.
   * @returns {string} - The generated arguments for the text spot function.
   */
  generateArguments(updatedDependencies) {
    const { reference, content, dependencies, parameters } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;
    let needDependencies = false;

    // Add node reference
    push($el(reference), parameters);

    // Check if the dependencies are updated.
    if (hasDependencies) {
      isLambda = some(dep => includes(dep, updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    } else {
      isLambda = has(content, updatedDependencies);
    }

    // Add the content to the arguments as a lambda function.
    push($lambda(isLambda, content), parameters);

    // Add dependencies to the arguments if needed.
    if (needDependencies) each(dep => push($lamb(dep), parameters), dependencies);

    return join(RAW_COMMA, parameters);
  }
}
