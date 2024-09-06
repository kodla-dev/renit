import { pipe } from '../../../helpers/index.js';
import { each, join, map, push } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { length, size } from '../../../libraries/math/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { $el, $lamb, $ltr, $str, generateStringObject } from '../utils/index.js';
import { ssrBlockTrim } from '../utils/node.js';
import { checkDependencies, checkUpdateInFunction } from '../utils/script.js';
import { BlockSpot } from './block.js';

export class SlotSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.name = node.name;
    this.reference = node.reference;
    this.attributes = node.attributes;
    this.parameters = [];
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.spots = [];
    this.references = [];
    this.own = {
      attributes: false,
      block: false,
      props: false,
      dyn: false,
    };
    this.raw = {
      props: RAW_EMPTY,
    };
    this.fn = RAW_EMPTY;
  }

  generate(component) {
    this.init(component);

    if (this.ssr) {
      const args = this.generateSSRArguments(component);
      return `$parent = $.ssrSlot(${args});`;
    } else {
      const args = this.generateCSRArguments(component);
      return `$.${this.fn}(${args});`;
    }
  }

  init(component) {
    let { ssr, name, reference, attributes, block, own } = this;
    let isLambda = false;
    own.attributes = !isEmpty(attributes);
    own.block = !isEmpty(block);
    const props = [];

    if (own.attributes) {
      each(attribute => {
        const name = attribute.name;
        let value = attribute.value;
        let disabled = false;
        let updated = false;

        if (isUndefined(value)) {
          value = true;
        } else if (isArray(value)) {
          value = value[0].content;
          updated = checkDependencies(value, component.updatedDependencies);
          if (updated) {
            isLambda = true;
          } else {
            updated = checkUpdateInFunction(value, component.scriptStatement);
            if (updated) isLambda = true;
          }
        } else {
          value = $str(value);
        }

        push({ name, value, disabled, updated }, props);
      }, attributes);
    }

    own.props = !isEmpty(props);

    if (own.props) {
      let rawProps = generateStringObject(props);
      if (!ssr && (isLambda || component.interface.has.props)) {
        rawProps = $lamb(`(${rawProps})`);
        own.dyn = true;
      }
      this.raw.props = rawProps;
    }

    this.reference = $el(reference);
    this.name = name == 'default' ? 'null' : $str(name);
  }

  generateCSRArguments(component) {
    let { name, reference, parameters, own, raw, fn } = this;
    push(reference, parameters);
    push(name, parameters);
    push('$current', parameters);
    push('$context', parameters);
    if (own.props) push(raw.props, parameters);

    if (own.block) {
      if (!own.props) push('null', parameters);
      const makeBlock = this.makeCSRBlock(component);
      if (makeBlock) {
        push(makeBlock, parameters);
        if (own.dyn) push('$.compare', parameters);
      }
    }

    fn = 'slot';
    if (own.dyn) {
      fn = 'slotDyn';
    }
    this.fn = fn;

    return join(RAW_COMMA, parameters);
  }

  makeCSRBlock(component) {
    let { block, references, spots } = this;
    const parameters = [];
    let trimBlock = block.trim();
    if (trimBlock != DOM_TEXT_SELECTOR) {
      block = trimBlock;
    }

    if (!block) return false;

    push($ltr(block), parameters);

    if (!isEmpty(references)) {
      const src = createSource();
      const param = ['$parent'];
      src.add('\n');

      src.adds([
        'let [',
        this.getElementReferences(references),
        '] = $.reference($parent);\n',
      ]);

      if (!isEmpty(spots)) {
        each(spot => {
          const generatedSpot = spot.generate(component);
          if (generatedSpot) {
            src.add(generatedSpot + '\n');
          }
        }, spots);
      }

      push($lamb(`{${src.toString()}}`, param), parameters);
    }

    return `$.makeBlock(${join(RAW_COMMA, parameters)})`;
  }

  generateSSRArguments(component) {
    let { name, block, spots, own, raw } = this;
    const parameters = [];
    push('$parent', parameters);
    push(name, parameters);
    push('$current', parameters);
    push('$context', parameters);

    if (own.props) {
      push(raw.props, parameters);
    }

    if (own.block) {
      block = ssrBlockTrim(block);
      if (!isEmpty(block)) {
        const src = createSource();
        src.add('() => {\n');
        src.add(`let $parent = '';\n`);
        src.add(`$parent += ${$ltr(block[0])};\n`);
        if (!isEmpty(spots)) {
          each(spot => {
            const generatedSpot = spot.generate(component);
            if (generatedSpot) {
              src.add(generatedSpot + '\n');
            }
          }, spots);
        }
        src.add(`return $parent;\n`);
        src.add('}');

        if (!own.props) {
          push('null', parameters);
        }
        push(src.toString(), parameters);
      }
    }

    return join(RAW_COMMA, parameters);
  }

  appendBlock(block) {
    if (this.ssr) {
      this.block[length(this.block) - 1] += block;
    } else {
      this.block += block;
    }
  }

  trimBlock() {
    if (this.ssr) {
      this.block[length(this.block) - 1] = this.block[length(this.block) - 1].trimEnd();
    } else {
      this.block = this.block.trim();
    }
  }

  startBlock() {
    push(RAW_EMPTY, this.block);
  }

  endBlock() {
    push(new BlockSpot(length(this.block) - 1, this), this.spots);
  }

  addReference() {
    const id = size(this.references);
    push(id, this.references);
    return id;
  }

  addSpot(spot) {
    push(spot, this.spots);
  }

  getElementReferences(references) {
    return pipe(
      references,
      map(ref => $el(ref)),
      join(RAW_COMMA)
    );
  }
}

export class SlotContentSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.spots = [];
    this.references = [];
    this.name = node.name;
    this.attributes = node.attributes;
  }

  appendBlock(block) {
    if (this.ssr) {
      this.block[length(this.block) - 1] += block;
    } else {
      this.block += block;
    }
  }

  trimBlock() {
    if (this.ssr) {
      this.block[length(this.block) - 1] = this.block[length(this.block) - 1].trimEnd();
    } else {
      this.block = this.block.trim();
    }
  }

  startBlock() {
    push(RAW_EMPTY, this.block);
  }

  endBlock() {
    push(new BlockSpot(length(this.block) - 1, this), this.spots);
  }

  addReference() {
    const id = size(this.references);
    push(id, this.references);
    return id;
  }

  addSpot(spot) {
    push(spot, this.spots);
  }
}
