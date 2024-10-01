import { pipe } from '../../../helpers/index.js';
import { each, filter, join, map, push } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { length, size } from '../../../libraries/math/index.js';
import { DOM_TEXT_SELECTOR, RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { createSource } from '../source.js';
import { $el, $lamb, $ltr, $str, generateStringObject } from '../utils/index.js';
import { isRefAttribute, ssrBlockTrim } from '../utils/node.js';
import { checkDependencies, checkUpdateInFunction } from '../utils/script.js';
import { BlockSpot } from './block.js';

export class ComponentSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.name = node.name;
    this.reference = node.reference;
    this.references = [];
    this.attributes = node.attributes;
    this.block = this.ssr ? [RAW_EMPTY] : RAW_EMPTY;
    this.blocks = [];
    this.spots = [];
    this.parameters = [];
    this.options = [];
    this.own = {
      attributes: false,
      props: false,
      blocks: false,
      ref: false,
    };
    this.raw = {
      props: RAW_EMPTY,
    };
    this.fn = RAW_EMPTY;
    this.dependencies = [];
    this.dynamic = false;
  }

  bootstrap() {
    const { blocks, attributes } = this;
    const dependencies = [];
    const localProps = [];

    each(block => {
      if (!isEmpty(block.attributes)) {
        each(attribute => {
          push(attribute.name, localProps);
        }, block.attributes);
      }
    }, blocks);

    each(attribute => {
      if (isArray(attribute.value)) {
        each(value => {
          if (value.dynamic) this.dynamic = true;
          if (!isEmpty(value.dependencies)) {
            push(value.dependencies, 1, dependencies);
          } else {
            push(value.content, dependencies);
          }
        }, attribute.value);
      }
    }, attributes);

    const hasLocalProps = !isEmpty(localProps);
    const hasDependencies = !isEmpty(dependencies);
    this.dependencies = dependencies;

    return {
      localProps,
      hasLocalProps,
      hasDependencies,
      dependencies,
    };
  }

  generate(component) {
    this.init(component);
    if (this.ssr) {
      return `$parent = $.ssrCall(${this.generateArguments(component)});`;
    } else {
      const args = this.generateArguments(component);
      let src = RAW_EMPTY;
      const ref = this.own.ref;
      if (ref) src += `${ref} = `;
      src += `$.${this.fn}(${args});`;
      if (ref) src += `\n$.unMount(() => ${ref} = null);`;
      return src;
    }
  }

  init(component) {
    let { reference, attributes, own, ssr, dynamic } = this;
    let isLambda = false;
    reference = $el(reference);
    own.attributes = !isEmpty(attributes);
    own.blocks = !isEmpty(this.blocks);

    if (!own.blocks) {
      if (ssr) {
        own.blocks = !isEmpty(filter(this.block));
      } else {
        own.blocks = !isEmpty(this.block);
      }
    }

    const props = [];

    if (own.attributes) {
      each(attribute => {
        if (isRefAttribute(attribute)) {
          own.ref = attribute.name;
          return;
        }
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

    if (dynamic) isLambda = true;

    if (own.props) {
      let rawProps = generateStringObject(props);
      if (!ssr && isLambda) {
        rawProps = $lamb(`(${rawProps})`);
        own.dyn = true;
      }
      this.raw.props = rawProps;
    }

    this.reference = reference;
    this.own = own;
  }

  generateArguments(component) {
    let { ssr, name, reference, parameters, own, raw, fn } = this;

    if (ssr) {
      push('$parent', parameters);
    } else {
      push(reference, parameters);
    }

    push(name, parameters);
    push('$context', parameters);

    let slots = false;

    if (own.blocks) {
      slots = this.generateSlotContent(component);
    }

    if (own.props) {
      if (!ssr && own.dyn) {
        if (slots) {
          push(`{slots: ${slots}}`, parameters);
        } else {
          push('{}', parameters);
        }
        push(raw.props, parameters);
        push('$.compare', parameters);
      } else {
        const option = [];
        push(`props: ${raw.props}`, option);
        if (slots) push(`slots: ${slots}`, option);
        push(`{${join(RAW_COMMA, option)}}`, parameters);
      }
    } else if (own.blocks) {
      if (slots) {
        push(`{slots: ${slots}}`, parameters);
      }
    }

    if (!ssr) {
      fn = 'call';
      if (own.dyn) {
        fn = 'callDyn';
      }
      this.fn = fn;
    }

    return join(RAW_COMMA, parameters);
  }

  generateSlotContent(component) {
    const contents = [];
    const blocks = this.blocks;
    const ssr = this.ssr;
    const hasDefaultSlot = length(filter(block => block.name == 'default', blocks));
    let make;

    if (!hasDefaultSlot) {
      if (ssr) {
        make = this.makeSSRContent(this, component);
      } else {
        make = this.makeCSRContent(this, component);
      }

      if (make) {
        push(`default: ${make}`, contents);
      }
    }

    each(content => {
      if (ssr) {
        make = this.makeSSRContent(content, component);
      } else {
        make = this.makeCSRContent(content, component);
      }
      if (make) {
        push(`${content.name}: ${make}`, contents);
      }
    }, blocks);

    if (isEmpty(contents)) {
      return false;
    } else {
      return `{${join(RAW_COMMA, contents)}}`;
    }
  }

  makeCSRContent(content, component) {
    const parameters = [];
    let cb = content.block;
    let cbTrim = cb.trim();
    if (cbTrim != DOM_TEXT_SELECTOR) {
      cb = cbTrim;
    }

    if (!cb) return false;
    push($ltr(cb), parameters);

    let blockFn = 'makeBlock';

    if (!isEmpty(content.references)) {
      blockFn = 'makeSlot';
      const src = createSource();
      const param = ['$parent'];
      src.add('\n');

      let localProps = false;
      if (!isEmpty(content.attributes)) {
        const namesMap = map(attribute => attribute.name, content.attributes);
        localProps = `{${join(RAW_COMMA, namesMap)}}`;
        src.add(`let ${localProps} = $localProps || ({});\n`);
      }

      src.adds([
        'let [',
        this.getElementReferences(content.references),
        '] = $.reference($parent);\n',
      ]);

      if (!isEmpty(content.spots)) {
        push('$context', param);
        push(`$instance_${component.name}`, param);
        each(spot => {
          const generatedSpot = spot.generate(component);
          if (generatedSpot) {
            src.add(generatedSpot + '\n');
          }
        }, content.spots);
      }

      if (localProps) {
        push('$localProps', param);
        src.add(`return $localProps => (${localProps} = $localProps, $u());`);
      }

      push($lamb(`{${src.toString()}}`, param), parameters);
    }

    return `$.${blockFn}(${join(RAW_COMMA, parameters)})`;
  }

  makeSSRContent(content, component) {
    let { block, spots } = content;
    const src = createSource();

    block = ssrBlockTrim(block);
    if (isEmpty(block)) return false;

    const param = ['$context'];

    let localProps = false;
    if (!isEmpty(content.attributes)) {
      const namesMap = map(attribute => attribute.name, content.attributes);
      localProps = `{${join(RAW_COMMA, namesMap)}}`;
      push('$localProps', param);
    }

    src.add(`(${join(RAW_COMMA, param)}) => {\n`);

    if (localProps) {
      src.add(`let ${localProps} = $localProps || ({});\n`);
    }

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
    src.add(`}`);

    return src.toString();
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

  addBlock(block) {
    push(block, this.blocks);
  }

  getElementReferences(references) {
    return pipe(
      references,
      map(ref => $el(ref)),
      join(RAW_COMMA)
    );
  }
}
