import {
  each,
  flat,
  has,
  includes,
  join,
  push,
  some,
  unique,
} from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { RAW_COMMA } from '../../define.js';
import {
  $el,
  $lamb,
  $ltr,
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

    let content = '';
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

    this.content = content;
  }

  /**
   * Generates the arguments for the attribute code.
   */
  generateArguments(updatedDependencies) {
    let { reference, content, define, dependencies, parameters } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;
    let needDependencies = false;

    push(reference, parameters);
    push(define, parameters);

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    }

    push(lambda(isLambda, $ltr(content)), parameters);

    if (needDependencies) each(dep => push($lamb(dep), parameters), dependencies);

    return join(RAW_COMMA, parameters);
  }
}
