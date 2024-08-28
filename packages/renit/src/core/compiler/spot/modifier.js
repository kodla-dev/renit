import { each, has, includes, join, push, some, unique } from '../../../libraries/collect/index.js';
import { isArray, isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_COMMA, RAW_EMPTY } from '../../define.js';
import { $el, $lambda, $str, adaptDefine } from '../utils/index.js';
import { checkDependencies } from '../utils/script.js';
import { updateStyleAttribute } from '../utils/style.js';

export class ModifierSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
    this.values = node.value;
    this.suffix = node.suffix;
    this.content = '';
    this.define = null;
    this.dependent = [];
    this.parameters = [];
    this.dependencies = isArray(this.values) ? this.values[0].dependencies : [];
    this.multiple = false;
    this.fn = RAW_EMPTY;
  }

  generate(component) {
    this.init(component);
    const args = this.generateArguments(component);
    return `$.${this.fn}(${args});`;
  }

  init(component) {
    const { reference, name, values, dependencies } = this;
    this.reference = $el(reference);
    this.define = adaptDefine(name);

    let content = '';
    if (isArray(values)) {
      const value = values[0];
      content = value.content.trim();
      if (isEmpty(value.dependencies)) {
        if (has(content, component.updatedDependencies)) {
          push(content, this.dependencies);
        }
      } else {
        push(value.dependencies, 1, this.dependencies);
      }
    } else {
      content = values.trim();
      if (isEmpty(dependencies)) {
        if (has(content, component.updatedDependencies)) {
          push(content, this.dependencies);
        }
      }
    }

    let dependent = [];

    each(suffix => {
      const name = updateStyleAttribute(suffix.name, component.changedStyles);
      push(name, dependent);
    }, this.suffix);

    if (size(dependent) == 1) {
      dependent = JSON.stringify(dependent[0]);
    } else {
      dependent = JSON.stringify(dependent);
      this.multiple = true;
    }

    this.content = '!!' + content;
    this.dependent = dependent;
    this.dependencies = unique(this.dependencies);
  }

  generateArguments(component) {
    let { reference, content, define, dependent, dependencies, parameters, fn, multiple } = this;
    const hasDependencies = !isEmpty(dependencies);
    let isLambda = false;

    push(reference, parameters);
    push(define, parameters);
    push(dependent, parameters);

    if (hasDependencies) {
      isLambda = some(dep => includes(dep, component.updatedDependencies), dependencies);
    } else {
      isLambda = checkDependencies(content, component.updatedDependencies);
    }

    push($lambda(isLambda, content), parameters);

    if (!isLambda) {
      fn = 'modifier';
      if (multiple) fn = 'modifiers';
    } else {
      fn = 'Modifier';
      if (multiple) fn = 'Modifiers';
    }

    this.fn = fn;

    return join(RAW_COMMA, parameters);
  }
}

export class ModifiersSpot {
  constructor(parent, modifiers) {
    this.parent = parent;
    this.modifiers = modifiers;
    this.parameters = [];
  }

  generate(component) {
    this.init(component);
    const args = this.generateSSRArguments();
    return `$parent = $.ssrAttribute(${args});`;
  }

  init(component) {
    const modifiers = [];
    each(modifierAttribute => {
      const modifier = new ModifierSpot(this.parent, modifierAttribute);
      modifier.init(component);
      push(modifier, modifiers);
    }, this.modifiers);
    this.modifiers = modifiers;
  }

  generateSSRArguments() {
    let { parameters, modifiers } = this;
    push('$parent', parameters);

    let contents = [];
    let define = RAW_EMPTY;
    let content = RAW_EMPTY;

    each(modifier => {
      let dependent = modifier.dependent;
      define = modifier.define;
      if (modifier.multiple) {
        const dependents = JSON.parse(modifier.dependent);
        dependent = $str(join(dependents));
      }
      content = `${modifier.content} && ${dependent}`;
      push(content, contents);
    }, modifiers);

    push(define, parameters);
    push(join(RAW_COMMA, contents), parameters);

    return join(RAW_COMMA, parameters);
  }
}
