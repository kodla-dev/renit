import {
  each,
  every,
  filter,
  has,
  includes,
  join,
  push,
  some,
  unique,
} from '../../../libraries/collect/index.js';
import { isEmpty, isString } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { $el, $lamb, $lambda, $ltr, $str, $var, adaptDefine } from '../utils/index.js';
import {
  isBracesAttribute,
  isClassAttribute,
  isClassOrIdAttribute,
  isIdentifier,
  isStringAttribute,
  isStyleAttribute,
} from '../utils/node.js';
import { checkDependencies, generateJavaScript, updateLiteral } from '../utils/script.js';
import { updateStyleAttribute } from '../utils/style.js';

export class AttributeSpot {
  constructor(parent, node, ssr) {
    this.parent = parent;
    this.reference = parent.reference;
    this.node = node;
    this.name = node.name;
    this.values = node.value;
    this.ssr = ssr;
    this.contents = '';
    this.content = '';
    this.define = null;
    this.dependencies = [];
    this.parameters = [];
    this.onlyOne = false;
    this.fn = RAW_EMPTY;
    this.dynamic = false;
  }

  /**
   * Generates the attribute code.
   */
  generate(component) {
    this.init(component);
    if (this.ssr) {
      const args = this.generateSSRArguments(component);
      return `$parent = $.ssrAttribute(${args});`;
    } else {
      const args = this.generateCSRArguments(component);
      return `$.${this.fn}(${args});`;
    }
  }

  /**
   * Initializes the attribute spot by processing values and dependencies.
   */
  init(component) {
    let { node, reference, name, values, ssr } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);
    let contents = [];
    const stringValues = isString(values);

    if (stringValues) {
      if (isClassOrIdAttribute(node)) {
        let type = 'id';
        if (isClassAttribute(node)) type = 'class';
        values = updateStyleAttribute(
          values,
          type,
          component.changedStyles,
          component.options.component
        );
      }
      push($str(values), contents);
    } else {
      const onlyOne = every(value => isBracesAttribute(value), values) && size(values) == 1;
      this.onlyOne = onlyOne;
      if (onlyOne) {
        let value = values[0];
        if (!isIdentifier(value.expression) && isStyleAttribute(name)) {
          updateLiteral(value.expression, component.changedStyles);
          value.content = generateJavaScript(value.expression);
        }

        push(value.content.trim(), contents);

        if (isEmpty(value.dependencies)) {
          if (has(value.content, component.updatedDependencies)) {
            push(value.content, this.dependencies);
          }
        } else {
          push(value.dependencies, 1, this.dependencies);
        }
        if (value.dynamic) this.dynamic = true;
      } else {
        each(value => {
          if (isStringAttribute(value)) {
            let trimVal = value.content.trim();
            if (!trimVal.length) return;
            if (isClassOrIdAttribute(node)) {
              let type = 'id';
              if (isClassAttribute(node)) type = 'class';
              trimVal = updateStyleAttribute(
                trimVal,
                type,
                component.changedStyles,
                component.options.component
              );
            }
            if (ssr) {
              push($str(trimVal), contents);
            } else {
              push(trimVal, contents);
            }
          } else if (isBracesAttribute(value)) {
            if (!isIdentifier(value.expression) && isStyleAttribute(name)) {
              updateLiteral(value.expression, component.changedStyles);
              value.content = generateJavaScript(value.expression);
            }

            if (ssr) {
              push(value.content.trim(), contents);
            } else {
              push($var(value.content.trim()), contents);
            }

            if (isEmpty(value.dependencies)) {
              if (has(value.content, component.updatedDependencies)) {
                push(value.content, this.dependencies);
              }
            } else {
              push(value.dependencies, 1, this.dependencies);
            }
            if (value.dynamic) this.dynamic = true;
          }
        }, values);
      }
    }

    this.dependencies = unique(this.dependencies);
    this.contents = contents;

    let content = join(contents);

    if (!this.onlyOne) {
      content = $ltr(content);
    }

    this.content = content;
  }

  /**
   * Generates the arguments for the attribute code.
   */
  generateCSRArguments(component) {
    let { reference, content, dynamic, define, dependencies, parameters, onlyOne, fn } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;
    let needDependencies = false;

    push(reference, parameters);
    push(define, parameters);

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, component.updatedDependencies), dependencies);
      if (isLambda) needDependencies = true;
    } else {
      isLambda = checkDependencies(content, component.updatedDependencies);
    }

    if (dynamic) isLambda = true;

    push($lambda(isLambda, content), parameters);

    if (needDependencies && !onlyOne) each(dep => push($lamb(dep), parameters), dependencies);

    if (!isLambda) {
      fn = 'attribute';
    } else {
      fn = 'Attribute';
    }

    this.fn = fn;

    return join(RAW_COMMA, parameters);
  }

  generateSSRArguments(component) {
    let { parent, name, define, contents, parameters } = this;
    push('$parent', parameters);
    push(define, parameters);

    let modifiers = false;
    let modifierContent = RAW_EMPTY;

    if (parent.modifiers) modifiers = parent.modifiers;
    if (modifiers) {
      modifiers = filter(modifier => modifier.name == name, modifiers);
      if (!isEmpty(modifiers)) {
        each(modifier => {
          modifier.init(component);
          let dependent = modifier.dependent;

          if (modifier.multiple) {
            const dependents = JSON.parse(modifier.dependent);
            dependent = $str(join(dependents));
          }
          modifierContent = `${modifier.content} && ${dependent}`;
          push(modifierContent, contents);
        }, modifiers);
      }
    }
    if (!isEmpty(contents)) push(join(RAW_COMMA, contents), parameters);

    return join(RAW_COMMA, parameters);
  }
}
