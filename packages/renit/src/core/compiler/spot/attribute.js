import {
  each,
  every,
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
import { $el, $lamb, $lambda, $ltr, $var, adaptDefine } from '../utils/index.js';
import {
  isCurlyBracesAttribute,
  isIdentifier,
  isStringAttribute,
  isStyleAttribute,
} from '../utils/node.js';
import { generateJavaScript, updateLiteral } from '../utils/script.js';

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
  generate({ updatedDependencies, changedStyles }) {
    this.init(updatedDependencies, changedStyles);
    return `$.attribute(${this.generateArguments(updatedDependencies)});`;
  }

  /**
   * Initializes the attribute spot by processing values and dependencies.
   */
  init(updatedDependencies, changedStyles) {
    const { reference, name, values } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);
    const onlyOne = every(value => isCurlyBracesAttribute(value), values) && size(values) == 1;
    this.onlyOne = onlyOne;

    let content = '';

    if (onlyOne) {
      let value = values[0];
      if (!isIdentifier(value.expression) && isStyleAttribute(name)) {
        updateLiteral(value.expression, changedStyles);
        value.content = generateJavaScript(value.expression);
      }

      content += value.content.trim();

      if (isEmpty(value.dependencies)) {
        if (has(value.content, updatedDependencies)) {
          push(value.content, this.dependencies);
        }
      } else {
        push(value.dependencies, 1, this.dependencies);
      }
    } else {
      each(value => {
        if (isStringAttribute(value)) {
          content += value.content;
        } else if (isCurlyBracesAttribute(value)) {
          if (!isIdentifier(value.expression) && isStyleAttribute(name)) {
            updateLiteral(value.expression, changedStyles);
            value.content = generateJavaScript(value.expression);
          }

          content += $var(value.content.trim());

          if (isEmpty(value.dependencies)) {
            if (has(value.content, updatedDependencies)) {
              push(value.content, this.dependencies);
            }
          } else {
            push(value.dependencies, 1, this.dependencies);
          }
        }
      }, values);
    }

    this.dependencies = unique(this.dependencies);

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

    push($lambda(isLambda, content), parameters);

    if (needDependencies && !onlyOne) each(dep => push($lamb(dep), parameters), dependencies);

    return join(RAW_COMMA, parameters);
  }
}
