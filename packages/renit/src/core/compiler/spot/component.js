import { each, join, push } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { $el, $lamb, $str, generateStringObject } from '../utils/index.js';
import { checkDependencies } from '../utils/script.js';

export class ComponentSpot {
  constructor(node, ssr) {
    this.ssr = ssr;
    this.name = node.name;
    this.reference = node.reference;
    this.attributes = node.attributes;
    this.parameters = [];
    this.options = [];
    this.own = {
      attributes: false,
      props: false,
    };
    this.raw = {
      props: RAW_EMPTY,
    };
    this.fn = RAW_EMPTY;
  }

  generate(component) {
    this.init(component);
    if (this.ssr) {
      return `$parent = $.ssrCall(${this.generateArguments()});`;
    } else {
      const args = this.generateArguments();
      return `$.${this.fn}(${args});`;
    }
  }

  init(component) {
    let { reference, attributes, own, ssr } = this;
    let isLambda = false;
    reference = $el(reference);
    own.attributes = !isEmpty(attributes);

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
          if (updated) isLambda = true;
        } else {
          value = $str(value);
        }

        push({ name, value, disabled, updated }, props);
      }, attributes);
    }

    own.props = !isEmpty(props);

    if (own.props) {
      let rawProps = generateStringObject(props);
      if (!ssr & isLambda) {
        rawProps = $lamb(`(${rawProps})`);
        own.dyn = true;
      }
      this.raw.props = rawProps;
    }
    this.reference = reference;
    this.own = own;
  }

  generateArguments() {
    let { ssr, name, reference, parameters, own, raw, fn } = this;

    if (ssr) {
      push('$parent', parameters);
    } else {
      push(reference, parameters);
    }

    push(name, parameters);
    push('$context', parameters);

    if (own.props) {
      if (!ssr && own.dyn) {
        push('{}', parameters);
        push(raw.props, parameters);
        push('$.compare', parameters);
      } else {
        const option = [];
        push(`props: ${raw.props}`, option);
        push(`{${join(RAW_COMMA, option)}}`, parameters);
      }
    }

    if (!ssr) {
      fn = 'call';
      if (own.dyn) {
        fn = 'dyn';
      }
      this.fn = fn;
    }

    return join(RAW_COMMA, parameters);
  }
}
