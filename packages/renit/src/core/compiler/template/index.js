import { each, includes, join, push } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { length } from '../../../libraries/math/index.js';
import { RAW_COMMA } from '../../define.js';
import { createSource } from '../source.js';
import { $str } from '../utils/index.js';
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
    /** @type {Object} Top script statements */
    this.topScriptStatement = {};
    /** @type {Boolean} Need link config */
    this.link = false;
    /** @type {Boolean} Need translate config */
    this.translate = false;
    /** @type {Boolean} Need loadLanguage config */
    this.loadLanguage = [];
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
    this.generateImports();

    // Generate top script statement
    this.generateTopScript();

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
  generateImports() {
    let link = 'link';
    let translate = 'translate';
    let loadLanguage = 'loadLanguage';
    const config = 'renit/config';

    each(importStatement => {
      const js = generateJavaScript(importStatement);
      if (includes(link, js) && includes(config, js)) link = false;
      if (includes(translate, js) && includes(config, js)) translate = false;
      this.sourceJs.add(js);
    }, this.importStatements);

    const configs = [];
    const hasLoadLanguage = !isEmpty(this.loadLanguage);
    if (this.link && link) push('link', configs);
    if (this.translate && translate) push('translate', configs);
    if (hasLoadLanguage && loadLanguage) push('loadLanguage', configs);
    if (length(configs) && (link || translate || loadLanguage)) {
      this.sourceJs.add(`import {${join(RAW_COMMA, configs)}} from "${config}";\n`);
    }

    if (hasLoadLanguage) {
      each(language => {
        this.sourceJs.add(`await loadLanguage(${$str(language)});\n`);
      }, this.loadLanguage);
    }
  }

  /**
   * Generates the top script statements from the topScriptStatement object.
   */
  generateTopScript() {
    if (!isEmpty(this.topScriptStatement)) {
      this.sourceJs.add(generateJavaScript(this.topScriptStatement));
    }
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
