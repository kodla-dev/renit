import { pipe } from '../../../helpers/index.js';
import { each, filter, join, map, push, unique } from '../../../libraries/collect/index.js';
import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { length, size } from '../../../libraries/math/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { $el, $lamb, $ltr } from '../utils/index.js';
import { BlockSpot } from './block.js';

export class IfSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.blocks = [];
    this.spots = [];
    this.reference = node.reference;
    this.references = [];
    this.value = node.value;
    this.parameters = [];
    this.own = {
      blocks: false,
      elseif: false,
    };
  }

  generate(component) {
    this.init();

    if (this.ssr) {
      return this.generateSSR(component);
    } else {
      return `$.ifBlock(${this.generateArguments(component)});`;
    }
  }

  init() {
    const ssr = this.ssr;
    let mergedBlocks = [];
    let values = [];
    this.own.blocks = !isEmpty(this.blocks);

    if (this.own.blocks) {
      each(block => push(block.value, values), this.blocks);
      values = unique(values);

      each(value => {
        let counter = 0;
        const spot = {
          type: RAW_EMPTY,
          block: ssr ? [RAW_EMPTY] : RAW_EMPTY,
          spots: [],
          references: [],
        };
        const blocks = filter(block => block.value == value, this.blocks);
        each((block, index) => {
          if (block instanceof IfSpot) {
            spot.type = 'IfSpot';
          } else if (block instanceof ElseIfSpot) {
            this.own.elseif = true;
            spot.type = 'ElseIfSpot';
          } else if (block instanceof ElseSpot) {
            spot.type = 'ElseSpot';
          }
          if (ssr) {
            if (isEmpty(spot.block[0])) {
              spot.block = block.block;
            }
          } else {
            spot.block += block.block;
          }

          spot.value = block.value;

          if (ssr && index > 0) {
            if (block instanceof ElseIfSpot || block instanceof ElseSpot) {
              push(new BlockSpot(0, block), spot.spots);
            }
          }

          if (!ssr) {
            each(reference => {
              each(s => {
                if (s.parentReference == reference) {
                  s.parentReference = counter;
                } else if (s.reference == reference) {
                  s.reference = counter;
                }
              }, block.spots);
              counter++;
            }, block.references);
          }

          push(block.spots, 1, spot.spots);
          if (!ssr) push(block.references, 1, spot.references);
        }, blocks);

        if (!ssr) {
          const referencesSize = size(spot.references);
          spot.references = Array.from({ length: referencesSize }, (v, i) => i);
        }

        push(spot, mergedBlocks);
      }, values);
      mergedBlocks.sort((a, b) => {
        if (isUndefined(a.value)) return 1;
        else if (isUndefined(b.value)) return -1;
      });
    }

    this.reference = $el(this.reference);
    this.blocks = mergedBlocks;
  }

  generateArguments(component) {
    let { reference, parameters } = this;
    push(reference, parameters);
    push(this.generateConditions(), parameters);
    push(this.generateParts(component), parameters);
    return join(RAW_COMMA, parameters);
  }

  generateConditions() {
    let { value, blocks, own } = this;
    let counter = 0;
    const src = createSource();
    let between = false;

    if (own.elseif) {
      src.add('\n');
      src.add(`if (${value}) return ${counter};\n`);
      counter++;
      between = true;
    } else {
      src.add(`${value} ? 0 : null`);
    }

    if (own.blocks) {
      each(block => {
        if (!isUndefined(block.value)) {
          src.add(`if (${block.value}) return ${counter};\n`);
          counter++;
        }
      }, blocks);
    }

    if (own.elseif) {
      src.add(`return ${counter};`);
      src.add('\n');
    }

    return $lamb(between ? `{${src.toString()}}` : src.toString());
  }

  generateParts(component) {
    let { blocks, own } = this;
    const parts = [];

    push(this.makeBlock(this, component), parts);

    if (own.blocks) {
      each(block => {
        push(this.makeBlock(block, component), parts);
      }, blocks);
    }

    return '[' + join(RAW_COMMA, parts) + ']';
  }

  makeBlock(content, component) {
    const parameters = [];
    let cb = content.block;
    let cbTrim = cb.trim();
    if (cbTrim != DOM_TEXT_SELECTOR) {
      cb = cbTrim;
    }
    push($ltr(cb), parameters);

    if (!isEmpty(content.references)) {
      const src = createSource();
      const param = ['$parent'];
      src.add('\n');

      src.adds([
        'let [',
        this.getElementReferences(content.references),
        '] = $.reference($parent);\n',
      ]);

      if (!isEmpty(content.spots)) {
        each(spot => {
          const generatedSpot = spot.generate(component);
          if (generatedSpot) {
            src.add(generatedSpot + '\n');
          }
        }, content.spots);
      }

      push($lamb(`{${src.toString()}}`, param), parameters);
    }

    return `$.makeBlock(${join(RAW_COMMA, parameters)})`;
  }

  generateSSR(component) {
    const { own, blocks } = this;
    const src = createSource();

    src.add(this.makeSSRBlock(this, component));

    if (own.blocks) {
      each(block => {
        src.add(this.makeSSRBlock(block, component));
      }, blocks);
    }

    return src.toString();
  }

  makeSSRBlock(content, component) {
    const src = createSource();

    if (content instanceof IfSpot || content.type == 'IfSpot') {
      src.add(`if (${content.value}) {\n`);
    } else if (content.type == 'ElseIfSpot') {
      src.add(`else if (${content.value}) {\n`);
    } else if (content.type == 'ElseSpot') {
      src.add(`else {\n`);
    }

    if (!isEmpty(content.block[0])) {
      src.add(`$parent += ${$ltr(content.block[0])};\n`);
    }

    if (!isEmpty(content.spots)) {
      each(spot => {
        const generatedSpot = spot.generate(component);
        if (generatedSpot) {
          src.add(generatedSpot + '\n');
        }
      }, content.spots);
    }
    src.add(`} `);

    return src.toString();
  }

  /**
   * Appends a block of content to the ifSpot.
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
   * Trims the block content of the ifSpot.
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
    push(new BlockSpot(length(this.block) - 1, this), this.spots);
  }

  /**
   * Adds a reference node to the ifSpot.
   * @returns {number} The ID of the reference node.
   */
  addReference() {
    const id = size(this.references);
    push(id, this.references);
    return id;
  }

  /**
   * Adds a spot to the ifSpot.
   * @param {Object} spot - The spot to add.
   */
  addSpot(spot) {
    push(spot, this.spots);
  }

  /**
   * Adds a block to the ifSpot.
   * @param {Object} spot - The spot to add.
   */
  addBlock(block) {
    push(block, this.blocks);
  }

  /**
   * Gets the element references for the component.
   * @returns {string} A string of element references.
   */
  getElementReferences(references) {
    return pipe(
      references,
      map(ref => $el(ref)),
      join(RAW_COMMA)
    );
  }
}

export class ElseIfSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.spots = [];
    this.references = [];
    this.value = node.value;
  }

  /**
   * Appends a block of content to the ifSpot.
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
   * Trims the block content of the ifSpot.
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
    push(new BlockSpot(length(this.block) - 1, this), this.spots);
  }

  /**
   * Adds a reference node to the ifSpot.
   * @param {Object} node - The reference node to add.
   * @returns {number} The ID of the reference node.
   */
  addReference() {
    const id = size(this.references);
    push(id, this.references);
    return id;
  }

  /**
   * Adds a spot to the ifSpot.
   * @param {Object} spot - The spot to add.
   */
  addSpot(spot) {
    push(spot, this.spots);
  }
}

export class ElseSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.spots = [];
    this.references = [];
    this.value = node.value;
  }

  /**
   * Appends a block of content to the ifSpot.
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
   * Trims the block content of the ifSpot.
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
    push(new BlockSpot(length(this.block) - 1, this), this.spots);
  }

  /**
   * Adds a reference node to the ifSpot.
   * @returns {number} The ID of the reference node.
   */
  addReference() {
    const id = size(this.references);
    push(id, this.references);
    return id;
  }

  /**
   * Adds a spot to the ifSpot.
   * @param {Object} spot - The spot to add.
   */
  addSpot(spot) {
    push(spot, this.spots);
  }
}
