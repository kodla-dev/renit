import { each, push } from '../../../libraries/collect/index.js';
import { createSource } from '../source.js';
import { generateJavaScript } from '../utils/script.js';

/**
 * Class representing a template for generating JavaScript code.
 */
export class Template {
  constructor(options) {
    this.options = options;
    /** @type {Array} Array to store components */
    this.components = [];
    /** @type {Array} Array to store import statements */
    this.importStatements = [];
    /** @type {Object} The source JavaScript object */
    this.sourceJs = {};
    /** @type {Object} The source CSS object */
    this.sourceCss = {};
  }

  /**
   * Generates the complete JavaScript code for the template.
   *
   * @returns {Object} An object containing the generated JavaScript code as a string.
   */
  generate() {
    // Initialize the source JavaScript and CSS object
    this.sourceJs = createSource();
    this.sourceCss = createSource();

    // Generate runtime import statement
    this.generateRuntime();

    // Generate import statements
    this.generateimports();

    // Generate components
    this.generateComponents();

    // Return the generated
    return {
      js: this.sourceJs.toString().trim(),
      css: this.sourceCss.toString().trim(),
    };
  }

  /**
   * Generates the import statement for the runtime library.
   */
  generateRuntime() {
    this.sourceJs.add('import * as $ from "renit/runtime";\n');
  }

  /**
   * Generates the import statements from the importStatements array.
   */
  generateimports() {
    each(importStatement => {
      this.sourceJs.add(generateJavaScript(importStatement));
    }, this.importStatements);
  }

  /**
   * Generates the components from the components array.
   */
  generateComponents() {
    let componentIsDefault = false;

    each(component => {
      const generatedComponent = component.generate();
      if (generatedComponent.default) componentIsDefault = true;
      this.sourceJs.add(generatedComponent.js);
      if (this.options.css.compile == 'external' && generatedComponent.css) {
        this.sourceCss.add(generatedComponent.css);
      }
    }, this.components);

    if (componentIsDefault) {
      this.sourceJs.add('\nexport default app;');
    }
  }

  /**
   * Adds a component to the components array.
   *
   * @param {Object} component - The component to add.
   */
  addComponent(component) {
    push(component, this.components);
  }

  /**
   * Adds an import statement to the importStatements array.
   *
   * @param {Object} importStatement - The import statement to add.
   */
  addImport(importStatement) {
    push(importStatement, this.importStatements);
  }
}
