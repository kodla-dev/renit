import { pipe } from '../../../helpers/index.js';
import { each, filter, has, join, map, push, unique } from '../../../libraries/collect/index.js';
import { isEmpty, isNumber } from '../../../libraries/is/index.js';
import { length, size } from '../../../libraries/math/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { $el, $lamb, $ltr } from '../utils/index.js';
import { ssrBlockTrim } from '../utils/node.js';
import { BlockSpot } from './block.js';

export class ForSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.blocks = [];
    this.spots = [];
    this.references = [];
    this.reference = node.reference;
    this.parameters = [];
    this.own = {
      blocks: false,
      as: false,
      computed: false,
      index: false,
      key: false,
    };
    this.value = node.value;
    this.as = node.as;
    this.index = node.index;
    this.key = node.key;
    this.elseBlock = undefined;
  }

  generate(component) {
    this.init();
    if (this.ssr) {
      return this.generateSSR(component);
    } else {
      return `$.forBlock(${this.generateArguments(component)});`;
    }
  }

  init() {
    const ssr = this.ssr;
    this.own.blocks = !isEmpty(this.blocks);
    this.own.as = !isEmpty(this.as.name);
    this.own.computed = !isEmpty(this.as.computed);
    this.own.index = !isEmpty(this.index);
    this.own.key = !isEmpty(this.key);
    this.reference = $el(this.reference);

    let elseBlock = {};
    if (this.own.blocks) {
      let values = [];
      each(block => push(block.value, values), this.blocks);
      values = unique(values);

      each(value => {
        let counter = 0;
        const spot = {
          block: ssr ? [RAW_EMPTY] : RAW_EMPTY,
          spots: [],
          references: [],
        };
        const blocks = filter(block => block.value == value, this.blocks);
        each(block => {
          if (ssr) {
            if (isEmpty(spot.block[0])) {
              spot.block = block.block;
            }
          } else {
            spot.block += block.block;
          }
          spot.value = block.value;
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

        elseBlock = spot;
      }, values);
    }

    this.elseBlock = elseBlock;
  }

  generateArguments(component) {
    let { reference, value, parameters, own, as, key, index } = this;
    push(reference, parameters);
    push($lamb(value), parameters);

    if (own.key) {
      const param = ['$item', '$index'];
      if (key == as.name) {
        push('$.noop', parameters);
      } else if (key == index) {
        push($lamb('$index', param), parameters);
      } else if (key.startsWith(as.name)) {
        key = key.replace(new RegExp(`\\b${as.name}\\b`, 'g'), '$item');
        push($lamb(key, param), parameters);
      } else if (own.computed) {
        each(computed => {
          if (has(computed, key)) {
            key = key.replace(new RegExp(`\\b${computed}\\b`, 'g'), '$item.' + computed);
          }
        }, as.computed);
        push($lamb(key, param), parameters);
      } else {
        push($lamb(key, param), parameters);
      }
    } else {
      if (isNumber(value)) {
        push('$.noop', parameters);
      } else {
        push('$.forKey', parameters);
      }
    }

    push(this.makeBlock(component), parameters);

    if (own.blocks) {
      push(this.makeElseBlock(component), parameters);
    }

    return join(RAW_COMMA, parameters);
  }

  makeBlock(component) {
    let { block, references, spots, as, index, own } = this;
    const parameters = [];

    let cb = block;
    let cbTrim = cb.trim();
    if (cbTrim != DOM_TEXT_SELECTOR) {
      cb = cbTrim;
    }
    push($ltr(cb), parameters);

    if (!isEmpty(references)) {
      const src = createSource();
      const param = ['$parent'];

      if (own.as && own.index) {
        push(as.name, param);
        push(index, param);
      } else if (own.index) {
        push('$item', param);
        push(index, param);
      } else if (own.as) {
        push(as.name, param);
      }

      src.add('\n');

      src.adds([
        'let [',
        this.getElementReferences(references),
        '] = $.reference($parent);\n',
      ]);

      let joinedComputed;

      if (own.computed) {
        joinedComputed = join(RAW_COMMA, as.computed);
        src.add(`let ${joinedComputed};\n`);
        src.add(`$.computed(() => ({${joinedComputed}} = ${as.name}));\n`);
      }

      if (!isEmpty(spots)) {
        each(spot => {
          const generatedSpot = spot.generate(component);
          if (generatedSpot) {
            src.add(generatedSpot + '\n');
          }
        }, spots);
      }

      if (!isEmpty(as.name) || !isEmpty(as.computed)) {
        const returnAsName = '_' + as.name;
        const returnIndexName = '_' + index;

        const returnParameters = [returnAsName];

        if (index) {
          push(returnIndexName, returnParameters);
        }

        let returnContent = createSource();

        returnContent.add(`${as.name} = ${returnAsName};\n`);

        if (index) {
          returnContent.add(`${index} = ${returnIndexName};\n`);
        }

        src.add(`return ` + $lamb(`{\n${returnContent.toString()}}`, returnParameters));
      }

      push($lamb(`{${src.toString()}}`, param), parameters);
    }

    return `$.makeBlock(${join(RAW_COMMA, parameters)})`;
  }

  makeElseBlock(component) {
    const content = this.elseBlock;
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
    const { own, value } = this;
    const src = createSource();

    if (own.blocks) {
      const len = `$${value}Len`;
      src.add(`const ${len} = ${value}.length;\n`);
      src.add(`if(${len}) {\n`);
      src.add(this.makeSSRBlock(this, component, len));
      src.add(`} else {\n`);
      src.add(this.makeSSRElseBlock(component));
      src.add(`}`);
    } else {
      src.add(this.makeSSRBlock(this, component));
    }

    return src.toString();
  }

  makeSSRBlock(content, component, len = false) {
    let { own, as, block } = content;
    const src = createSource();
    let index = '$index';
    let value = content.value;

    if (own.index) index = content.index;

    if (len) {
      src.add(`for (let ${index} = 0; ${index} < ${len}; ${index}++) {\n`);
    } else {
      src.add(`for (let ${index} = 0, $len = ${value}.length; ${index} < $len; ${index}++) {\n`);
    }

    if (own.computed) {
      src.add(`const {${join(RAW_COMMA, as.computed)}} = ${value}[${index}];\n`);
    } else if (own.as) {
      src.add(`const ${as.name} = ${value}[${index}];\n`);
    }

    block = ssrBlockTrim(block);

    if (!isEmpty(block[0])) {
      src.add(`$parent += ${$ltr(block[0])};\n`);
    }

    if (!isEmpty(content.spots)) {
      each(spot => {
        const generatedSpot = spot.generate(component);
        if (generatedSpot) {
          src.add(generatedSpot + '\n');
        }
      }, content.spots);
    }

    src.add(`}`);
    return src.toString();
  }

  makeSSRElseBlock(component) {
    const src = createSource();
    const content = this.elseBlock;
    let block = ssrBlockTrim(content.block);
    if (!isEmpty(block[0])) {
      src.add(`$parent += ${$ltr(block[0])};\n`);
    }
    if (!isEmpty(content.spots)) {
      each(spot => {
        const generatedSpot = spot.generate(component);
        if (generatedSpot) {
          src.add(generatedSpot + '\n');
        }
      }, content.spots);
    }
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
