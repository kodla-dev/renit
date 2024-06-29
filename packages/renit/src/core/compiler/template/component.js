import { pipe } from '../../../helpers/index.js';
import { each, flat, join, map, push, unique } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { parseExports, prepareScript } from '../utils/ast.js';
import { $el, $ltr, generateStyleHash } from '../utils/index.js';

/**
 * Class representing a component for generating JavaScript code.
 */
export class Component {
  /**
   * Creates a Component instance.
   * @param {string} name - The name of the component.
   * @param {Object} options - Configuration options for the component.
   */
  constructor(name, options) {
    /** @type {string} Name of the component */
    this.name = name;
    /** @type {Object} Options for the component */
    this.options = options;
    /** @type {Object} Script statement for the component */
    this.scriptStatement = {};
    /** @type {Array} Export statements for the component */
    this.exportStatements = [];
    /** @type {Object} Source JavaScript object */
    this.sourceJs = {};
    /** @type {Object} Interface for the component */
    this.interface = {};
    /** @type {string} Block content for the component */
    this.block = RAW_EMPTY;
    /** @type {string} Style content for the component */
    this.style = RAW_EMPTY;
    /** @type {boolean} Indicates if the component is embedded */
    this.embed = false;
    /** @type {Array} References within the component */
    this.references = [];
    /** @type {Array} Spots within the component */
    this.spots = [];
    /** @type {Array} Properties of the component */
    this.props = [];
    /** @type {Array} Dependencies of the component */
    this.dependencies = [];
    /** @type {Array} Updated dependencies of the component */
    this.updatedDependencies = [];
    /** @type {Array} Function names within the component */
    this.functionNames = [];
    /** @type {Array} Changed styles within the component */
    this.changedStyles = [];
  }

  /**
   * Generates the JavaScript code for the component.
   * @returns {Object} An object containing the generated JavaScript code as a string.
   */
  generate() {
    this.sourceJs = createSource();
    this.prepareInterface();

    if (this.interface.has.block) {
      this.generateComponent(() => {
        this.generateScript();
        this.generateBlock(() => {
          this.generateSpots();
          this.generateStyle();
        });
      });
    }

    return {
      js: this.sourceJs.toString(),
    };
  }

  /**
   * Prepares the interface for the component.
   */
  prepareInterface() {
    const isScriptEmpty = isEmpty(this.scriptStatement);
    const isExportEmpty = isEmpty(this.exportStatements);
    const isBlockEmpty = isEmpty(this.block);
    const isStyleEmpty = isEmpty(this.style);
    const isReferencesEmpty = isEmpty(this.references);
    const isSpotsEmpty = isEmpty(this.spots);
    let isUpdatedDependenciesEmpty = isEmpty(this.updatedDependencies);

    let rawProps;
    let rawScript;
    let hasComputed = false;

    if (!isExportEmpty) {
      const declarations = [];
      const variables = [];

      each(exportStatement => {
        const parsedExport = parseExports(exportStatement);
        push(parsedExport.declarations, 1, declarations);
        push(parsedExport.variables, 1, variables);
      }, this.exportStatements);

      this.props = unique(variables);
      rawProps = `let {${join(RAW_COMMA, unique(declarations))}} = $p;\n`;
    }

    if (!isScriptEmpty) {
      const preparedScript = prepareScript(
        this.scriptStatement,
        this.dependencies,
        this.changedStyles
      );
      this.functionNames = preparedScript.functionNames;
      hasComputed = preparedScript.hasComputed;
      rawScript = preparedScript.raw;
      if (!isEmpty(preparedScript.hasUpdatedDependencies)) {
        push(preparedScript.hasUpdatedDependencies, 1, this.updatedDependencies);
        this.updatedDependencies = unique(this.updatedDependencies);
        isUpdatedDependenciesEmpty = false;
      }
    }

    this.interface = {
      has: {
        script: !isScriptEmpty,
        style: !isStyleEmpty,
        props: !isExportEmpty,
        block: !isBlockEmpty,
        references: !isReferencesEmpty,
        spots: !isSpotsEmpty,
        computed: hasComputed,
        updated: !isUpdatedDependenciesEmpty,
      },
      raw: {
        props: rawProps,
        script: rawScript,
      },
    };
  }

  /**
   * Generates the main structure of the component.
   * @param {Function} body - Function to generate the body of the component.
   */
  generateComponent(body) {
    const src = this.sourceJs;
    const name = this.name;
    let start;

    if (name === 'default') {
      start = '\nexport default function () {\n';
    } else {
      start = `\nexport function ${name}() {\n`;
    }

    src.add(start);
    src.add('return $.component(function () {\n');
    body();
    src.adds(['});\n', '}\n']);
  }

  /**
   * Generates the script for the component.
   */
  generateScript() {
    const src = this.sourceJs;
    const Interface = this.interface;

    if (Interface.has.spots || Interface.has.props) {
      src.add(`const $t = this;\n`);
    }

    if (Interface.has.props || Interface.has.computed || Interface.has.updated) {
      const context = [];
      if (Interface.has.props) push('$p', context);
      if (Interface.has.computed) push('$c', context);
      if (Interface.has.updated) push('$u', context);
      src.add(`let {${join(RAW_COMMA, context)}} = $t;\n`);
    }

    if (Interface.has.props) src.add(Interface.raw.props);
    if (Interface.has.script) src.add(Interface.raw.script);
  }

  /**
   * Generates the block for the component.
   * @param {Function} body - Function to generate the body of the block.
   */
  generateBlock(body) {
    const src = this.sourceJs;
    const Interface = this.interface;
    let spot = 'block';
    if (this.embed) spot = 'embed';

    if (Interface.has.block) {
      src.add(`const $parent = $.${spot}(${$ltr(this.block)});\n`);

      if (Interface.has.references) {
        src.adds(['let [', this.getElementReferences(), '] = $.reference($parent);\n']);
      }

      body();
      src.add(`return $parent;\n`);
    }
  }

  /**
   * Generates spots within the component.
   */
  generateSpots() {
    const src = this.sourceJs;
    const Interface = this.interface;

    if (Interface.has.spots) {
      each(spot => {
        const generatedSpot = spot.generate(this);
        if (generatedSpot) {
          src.add(generatedSpot + '\n');
        }
      }, this.spots);
    }
  }

  /**
   * Generates styles for the component.
   */
  generateStyle() {
    const src = this.sourceJs;
    const Interface = this.interface;
    const options = this.options;

    if (Interface.has.style && options.css.compile == 'injected') {
      const hash = generateStyleHash(options.css.hash.min, options.css.hash.max);
      src.add(`$.style('${hash}', \`${this.style}\`);\n`);
    }
  }

  /**
   * Sets the script statement for the component.
   * @param {Object} script - The script statement to set.
   */
  setScript(script) {
    this.scriptStatement = script;
  }

  /**
   * Adds an export statement to the component.
   * @param {Object} exportStatement - The export statement to add.
   */
  addExport(exportStatement) {
    push(exportStatement, this.exportStatements);
  }

  /**
   * Adds a spot to the component.
   * @param {Object} spot - The spot to add.
   */
  addSpot(spot) {
    push(spot, this.spots);
  }

  /**
   * Adds a reference node to the component.
   * @param {Object} node - The reference node to add.
   * @returns {number} The ID of the reference node.
   */
  addReference(node) {
    const id = size(this.references);
    push({ id, node }, this.references);
    return id;
  }

  /**
   * Adds dependencies to the component.
   * @param {Array} dependencies - The dependencies to add.
   * @param {string} content - The content associated with the dependencies.
   */
  addDependencies(dependencies, content) {
    if (isEmpty(dependencies)) dependencies = content;
    push(dependencies, this.dependencies);
    this.dependencies = pipe(this.dependencies, flat, unique);
  }

  /**
   * Adds content to the updatedDependencies list.
   * @param {string|string[]} content - The content to be added to the updatedDependencies list.
   */
  addUpdatedDependencies(content) {
    push(content, this.updatedDependencies);
  }

  /**
   * Adds changed styles to the component.
   * @param {Object} style - The style to add.
   */
  addChangedStyles(style) {
    push(style, this.changedStyles);
    this.changedStyles = pipe(
      this.changedStyles,
      flat,
      unique(item => item.old)
    );
  }

  /**
   * Appends a block of content to the component.
   * @param {string} block - The block content to append.
   */
  appendBlock(block) {
    this.block += block;
  }

  /**
   * Appends a style to the component.
   * @param {string} style - The style content to append.
   */
  appendStyle(style) {
    this.style += style;
  }

  /**
   * Trims the block content of the component.
   */
  trimBlock() {
    this.block = this.block.trim();
  }

  /**
   * Gets the element references for the component.
   * @returns {string} A string of element references.
   */
  getElementReferences() {
    return pipe(
      this.references,
      map(ref => $el(ref.id)),
      join(RAW_COMMA)
    );
  }
}
