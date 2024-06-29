import {
  each,
  every,
  flat,
  has,
  includes,
  join,
  push,
  some,
  unique,
} from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_COMMA } from '../../define.js';
import {
  $el,
  $lamb,
  $ltr,
  $u,
  $var,
  adaptDefine,
  isCurlyBracesAttribute,
  isStringAttribute,
  lambda,
} from '../utils/index.js';

export class AttributeSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
    this.values = node.value;
    this.content = '';
    this.define = null;
    this.dependencies = [];
    this.parameters = ['$t'];
    this.onlyOne = false;
  }

  /**
   * Generates the attribute code.
   */
  generate({ updatedDependencies }) {
    this.init(updatedDependencies);
    return `$.attribute(${this.generateArguments(updatedDependencies)});`;
  }

  /**
   * Initializes the attribute spot by processing values and dependencies.
   */
  init(updatedDependencies) {
    const { reference, name, values } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);
    const onlyOne = every(value => isCurlyBracesAttribute(value), values) && size(values) == 1;
    this.onlyOne = onlyOne;

    let content = '';

    if (onlyOne) {
      const value = values[0];
      content += value.content.trim();
      if (has(value.content, updatedDependencies)) {
        push(value.content, this.dependencies);
      }
    } else {
      each(value => {
        if (isStringAttribute(value)) {
          content += value.content;
        } else if (isCurlyBracesAttribute(value)) {
          content += $var(value.content.trim());

          if (isEmpty(value.dependencies)) {
            if (has(value.content, updatedDependencies)) {
              push(value.content, this.dependencies);
            }
          } else {
            push(value.dependencies, this.dependencies);
          }

          this.dependencies = unique(flat(this.dependencies));
        }
      }, values);
    }

    if (!onlyOne) {
      content = $ltr(content);
    }
    this.content = content;
  }

  /**
   * Generates the arguments for the attribute code.
   */
  generateArguments(updatedDependencies) {
    const { reference, content, define, dependencies, parameters, onlyOne } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;
    let needDependencies = false;

    push(reference, parameters);
    push(define, parameters);

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    }

    push(lambda(isLambda, content), parameters);

    if (needDependencies && !onlyOne) each(dep => push($lamb(dep), parameters), dependencies);

    return join(RAW_COMMA, parameters);
  }
}

export class BindAttributeSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
    this.value = node.value;
    this.define = null;
    this.parameters = ['$t'];
  }

  /**
   * Generates the binding attribute spot as a string.
   * @returns {string} The generated binding attribute spot string.
   */
  generate() {
    this.init();
    return `$.input(${this.generateArguments()});`;
  }

  /**
   * Initializes the reference, define, and value properties.
   */
  init() {
    let { reference, name, value } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);
    this.value = value[0].content.trim();
  }

  /**
   * Generates the arguments string for the binding attribute spot.
   * @returns {string} The generated arguments string.
   */
  generateArguments() {
    const { reference, value, define, parameters } = this;

    push(reference, parameters);
    push(define, parameters);
    push($lamb(value), parameters);
    push($lamb(`${value}=` + $u('$e', false), '$e'), parameters);

    return join(RAW_COMMA, parameters);
  }
}
