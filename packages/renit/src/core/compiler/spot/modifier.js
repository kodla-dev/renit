import { each, has, includes, join, push, some, unique } from '../../../libraries/collect/index.js';
import { isArray, isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_COMMA } from '../../define.js';
import { $el, $lambda, adaptDefine } from '../utils/index.js';
import { updateStyleAttribute } from '../utils/style.js';

export class ModifierSpot {
  constructor(parent, node, dependencies = []) {
    this.reference = parent.reference;
    this.name = node.name;
    this.values = node.value;
    this.suffix = node.suffix;
    this.content = '';
    this.define = null;
    this.dependent = [];
    this.parameters = ['$t'];
    this.dependencies = dependencies;
  }
  generate({ updatedDependencies, changedStyles }) {
    this.init(updatedDependencies, changedStyles);
    return `$.modifier(${this.generateArguments(updatedDependencies)});`;
  }

  init(updatedDependencies, changedStyles) {
    const { reference, name, values, dependencies } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);

    let content = '';
    if (isArray(values)) {
      const value = values[0];
      content = value.content.trim();
      if (isEmpty(value.dependencies)) {
        if (has(content, updatedDependencies)) {
          push(content, this.dependencies);
        }
      } else {
        push(value.dependencies, 1, this.dependencies);
      }
    } else {
      content = values.trim();
      if (isEmpty(dependencies)) {
        if (has(content, updatedDependencies)) {
          push(content, this.dependencies);
        }
      }
    }

    let dependent = [];

    each(suffix => {
      const name = updateStyleAttribute(suffix.name, changedStyles);
      push(name, dependent);
    }, this.suffix);

    if (size(dependent) == 1) {
      dependent = JSON.stringify(dependent[0]);
    } else {
      dependent = JSON.stringify(dependent);
    }

    this.content = '!!' + content;
    this.dependent = dependent;
    this.dependencies = unique(this.dependencies);
  }

  generateArguments(updatedDependencies) {
    const { reference, content, define, dependent, dependencies, parameters } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;

    push(reference, parameters);
    push(define, parameters);
    push(dependent, parameters);

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, updatedDependencies), dependencies);
    }

    push($lambda(isLambda, content), parameters);

    return join(RAW_COMMA, parameters);
  }
}
