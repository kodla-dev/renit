import { pipe } from '../../../helpers/index.js';
import { each, flat, join, map, push, unique } from '../../../libraries/collect/index.js';
import { isArray, isEmpty } from '../../../libraries/is/index.js';
import { length } from '../../../libraries/math/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { createSource } from '../source.js';
import { BlockSpot } from '../spot/block.js';
import { $el, $ltr } from '../utils/index.js';
import { isSSR } from '../utils/node.js';
import { parseExports, prepareScript } from '../utils/script.js';
import { generateStyleHash } from '../utils/style.js';

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
    options.component.name = name;
    /** @type {Object} Options for the component */
    this.options = options;
    /** @type {boolean} Server side render */
    this.ssr = isSSR(options);
    /** @type {Object} Script statement for the component */
    this.scriptStatement = {};
    /** @type {Array} Export statements for the component */
    this.exportStatements = [];
    /** @type {Object} Source JavaScript object */
    this.sourceJs = {};
    /** @type {Object} Interface for the component */
    this.interface = {};
    /** @type {string} Block content for the component */
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    /** @type {string} Style content for the component */
    this.style = RAW_EMPTY;
    /** @type {string} Style contents for the component */
    this.styles = [];
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
    /** @type {Array} Function dependencies of the component */
    this.functionDependencies = [];
    /** @type {Array} Updated dependencies of the component */
    this.updatedDependencies = [];
    /** @type {Array} Function names within the component */
    this.functionNames = [];
    /** @type {Array} Changed styles within the component */
    this.changedStyles = [];
    /** @type {boolean} Create root event */
    this.rootEvent = false;
    /** @type {boolean} Export default component */
    this.default = false;
    /** @type {boolean} Need context */
    this.context = false;
    /** @type {boolean} Need current */
    this.current = false;
    /** @type {boolean} Has inside component */
    this.insideComponent = false;
    /** @type {boolean} Has update identifier */
    this.hasUpdate = false;
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

    let css = false;
    if (this.options.css.compile == 'external') css = join(RAW_EMPTY, this.styles);

    return {
      default: this.default,
      js: this.sourceJs.toString(),
      css,
    };
  }

  /**
   * Prepares the interface for the component.
   */
  prepareInterface() {
    const ssr = this.ssr;
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
      let declarations = [];
      const variables = [];

      each(exportStatement => {
        const parsedExport = parseExports(exportStatement);
        push(parsedExport.declarations, 1, declarations);
        push(parsedExport.variables, 1, variables);
      }, this.exportStatements);

      this.props = unique(variables);

      if (!isEmpty(this.props)) {
        each(prop => push(prop, this.updatedDependencies), this.props);
        isUpdatedDependenciesEmpty = false;
      }

      declarations = unique(declarations);

      const propsSrc = createSource();

      propsSrc.add('let $props = $option.props || ({});\n');
      propsSrc.add(`let {${join(RAW_COMMA, declarations)}} = $props;\n`);

      if (!ssr) {
        const propsEquals = pipe(
          this.props,
          map(p => p + '=' + p),
          join(RAW_COMMA)
        );
        propsSrc.add(`$.current.apply = $$props => ({${propsEquals}} = $props = $$props);\n`);
        // propsSrc.add(`$.current.exports = () => ({${join(RAW_COMMA, this.props)}});\n`);
      }

      rawProps = propsSrc.toString();
    }

    if (!isScriptEmpty) {
      const preparedScript = prepareScript(
        this.scriptStatement,
        this.dependencies,
        this.functionDependencies,
        this.changedStyles,
        ssr
      );

      this.functionNames = preparedScript.functionNames;
      hasComputed = preparedScript.hasComputed;
      rawScript = preparedScript.raw;
      if (preparedScript.hasUpdatedDependencies) {
        push(preparedScript.updatedDependencies, 1, this.updatedDependencies);
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
    const ssr = this.ssr;
    let name = this.name;

    if (name === 'default') {
      this.default = true;
      if (ssr) {
        src.add(`\nconst app = $.ssrComponent($option => {\n`);
      } else {
        src.add(`\nconst app = $.component($option => {\n`);
      }
    } else {
      if (ssr) {
        src.add(`\nexport const ${name} = $.ssrComponent($option => {\n`);
      } else {
        src.add(`\nexport const ${name} = $.component($option => {\n`);
      }
    }

    body();
    src.add('});\n');
  }

  /**
   * Generates the script for the component.
   */
  generateScript() {
    const src = this.sourceJs;
    const Interface = this.interface;
    const ssr = this.ssr;

    if (!ssr) {
      if (Interface.has.updated || this.hasUpdate) {
        src.add(`const $u = $.update();\n`);
      } else if (Interface.has.props || Interface.has.spots || Interface.has.computed) {
        src.add(`$.update();\n`);
      }
    }

    if (this.current) src.add(`const $current = $.current;\n`);
    if (this.context) src.add(`const $context = $.context;\n`);

    if (Interface.has.props) src.add(Interface.raw.props);
    if (Interface.has.script) src.add(Interface.raw.script);
  }

  /**
   * Generates the block for the component.
   * @param {Function} body - Function to generate the body of the block.
   */
  generateBlock(body) {
    const src = this.sourceJs;
    const ssr = this.ssr;
    let block = this.block;

    if (ssr) {
      src.add(`let $parent = ${$ltr(block[0])};\n`);
    } else {
      const Interface = this.interface;
      let spot = 'block';
      if (this.embed) spot = 'embed';
      const param = [];
      if (block.trim() == DOM_TEXT_SELECTOR) {
        block = RAW_WHITESPACE + DOM_TEXT_SELECTOR + RAW_WHITESPACE;
      }
      push($ltr(block), param);
      // if (!this.insideComponent) push(1, param);
      src.add(`const $parent = $.${spot}(${join(RAW_COMMA, param)});\n`);
      if (this.rootEvent) {
        src.add(`const $rootEvent = $.rootEvent($parent);\n`);
      }
      if (Interface.has.references) {
        src.adds(['let [', this.getElementReferences(), '] = $.reference($parent);\n']);
      }
    }
    body();
    src.add(`return $parent;\n`);
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
    const ssr = this.ssr;
    const src = this.sourceJs;
    const Interface = this.interface;
    const options = this.options;
    if (Interface.has.style) {
      if (options.css.compile == 'injected') {
        if (ssr) {
          const content = $ltr(`<style>${this.style}</style>`);
          src.add(`$parent += ${content};\n`);
        } else {
          const hash = generateStyleHash();
          src.add(`$.style('${hash}', \`${this.style}\`);\n`);
        }
      } else if (options.css.compile == 'external') {
        if (ssr) {
          src.add(`$option.results.css.add = ${$ltr(this.style)};\n`);
        }

        push(this.style, this.styles);
      }
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
   * @returns {number} The ID of the reference node.
   */
  addReference() {
    const id = length(this.references);
    push(id, this.references);
    return id;
  }

  /**
   * Adds dependencies to the component.
   * @param {Array} dependencies - The dependencies to add.
   * @param {string} content - The content associated with the dependencies.
   */
  addDependencies(dependencies, content) {
    if (isEmpty(dependencies)) dependencies = content;

    if (isArray(dependencies)) {
      push(dependencies, 1, this.dependencies);
    } else {
      push(dependencies, this.dependencies);
    }

    this.dependencies = unique(this.dependencies);
  }

  /**
   * Adds a function name to the list of function dependencies.
   * @param {string} name - The name of the function to add as a dependency.
   */
  addFunctionDependencies(name) {
    push(name, this.functionDependencies);
  }

  /**
   * Adds content to the updatedDependencies list.
   * @param {string|string[]} content - The content to be added to the updatedDependencies list.
   */
  addUpdatedDependencies(content) {
    if (isArray(content)) {
      push(content, 1, this.updatedDependencies);
    } else {
      push(content, this.updatedDependencies);
    }
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
      unique(item => item.old && item.type && item.new)
    );
  }

  /**
   * Appends a block of content to the component.
   * @param {string} block - The block content to append.
   */
  appendBlock(block) {
    if (this.ssr) {
      this.block[length(this.block) - 1] += block;
    } else {
      this.block += block;
    }
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
    if (this.ssr) {
      this.block[length(this.block) - 1] = this.block[length(this.block) - 1].trimEnd();
    } else {
      this.block = this.block.trim();
    }
  }

  /**
   * Starts a new block by pushing an empty string into the block array.
   */
  startBlock() {
    push(RAW_EMPTY, this.block);
  }

  /**
   * Ends the current block by creating a new `BlockSpot` instance and pushing it into the spots array.
   * The `BlockSpot` is created with the index of the last item in the block array.
   */
  endBlock() {
    push(new BlockSpot(length(this.block) - 1), this.spots);
  }

  /**
   * Gets the element references for the component.
   * @returns {string} A string of element references.
   */
  getElementReferences() {
    return pipe(
      this.references,
      map(ref => $el(ref)),
      join(RAW_COMMA)
    );
  }
}
