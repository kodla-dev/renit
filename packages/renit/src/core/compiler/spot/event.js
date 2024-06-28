import { each, has, join, prepend, push, split, unique } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { RAW_COMMA, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { createSource } from '../source.js';
import { functionExpressionAnalysis, javaScriptSyntaxCorrection } from '../utils/ast.js';
import { $el, $element, $event, adaptDefine, lambda } from '../utils/index.js';

/**
 * Class representing an EventSpot which handles event-related functionality in the AST.
 */
export class EventSpot {
  /**
   * Creates an instance of EventSpot.
   * @param {Object} parent - The parent node.
   * @param {Object} node - The current node.
   * @param {Array} modifier - List of modifiers for the event.
   * @param {string} handler - The event handler code.
   */
  constructor(parent, node, modifier, handler) {
    this.parentReference = parent.reference;
    this.reference = null;
    this.name = node.name;
    this.expression = node.value[0].expression;
    this.modifier = modifier;
    this.modifiers = {
      prevent: ['preventDefault', 'prevent'],
      stop: ['stopPropagation', 'stop'],
      control: ['ctrl', 'alt', 'shift', 'meta'],
      process: ['enter', 'tab', 'esc', 'space', 'up', 'down', 'left', 'right'],
      delete: 'delete',
    };
    this.handler = handler;
    this.parameters = ['$t'];
    this.own = {};
    this.event = $event;
    this.eventName = null;
  }

  /**
   * Generates the event handling code.
   * @returns {string} - The generated event handling code.
   */
  generate(component) {
    this.init();
    return `$.event(${this.generateArguments(component)});`;
  }

  /**
   * Initializes the event spot by analyzing the function expression and setting properties.
   */
  init() {
    const { parentReference, name, modifier, handler } = this;

    this.own = functionExpressionAnalysis(this.expression);
    this.reference = $el(parentReference);
    this.eventName = adaptDefine(name);
    this.own.modifier = !isEmpty(modifier);
    this.own.param = !isEmpty(this.own.params);
    this.own.argument = !isEmpty(this.own.arguments);
    this.own.event = has($event, handler);
    this.own.element = has($element, handler);

    if (this.own.param) {
      this.event = this.own.params[0];
    }
  }

  /**
   * Generates the arguments for the event function.
   * @returns {string} - The generated arguments as a string.
   */
  generateArguments(component) {
    let { reference, handler, parameters, eventName, event, own } = this;
    let needUpdate = false;
    let modifierContent;
    if (own.modifier) {
      modifierContent = this.generateModifier();
    }

    push(reference, parameters);
    push(eventName, parameters);

    if (!has(own.function, component.functionNames)) needUpdate = true;

    if (own.modifier || own.assignment || needUpdate) {
      const src = createSource();
      const params = own.param
        ? join(RAW_COMMA, own.params)
        : own.event || own.modifier
          ? event
          : RAW_EMPTY;

      src.add(`(${params}) => {\n`);
      if (own.modifier) src.add(modifierContent);

      if (own.function) {
        src.add(own.function + `(${this.ownArguments()});\n`);
      } else if (own.assignment) {
        needUpdate = true;
        if (own.element) handler = handler.replace($element, reference);
        handler = javaScriptSyntaxCorrection(handler);
        const identifier = split('=', handler)[0].trim();
        push(identifier, component.updatedDependencies);
        src.add(handler);
      }

      if (needUpdate) src.add(`$u();\n`);

      src.add(`}`);
      push(src.toString(), parameters);
    } else {
      let isLambda = false;
      let call = own.function;
      let params = [];

      if (own.argument) {
        call = call + `(${this.ownArguments()})`;
        isLambda = true;
      }

      if (own.event) prepend(event, own.params);

      if (!isEmpty(own.params)) {
        params = join(RAW_COMMA, unique(own.params));
      }

      push(lambda(isLambda, call, params), parameters);
    }

    return join(RAW_COMMA, parameters);
  }

  /**
   * Generates the code for event modifiers.
   * @returns {string} - The generated modifier code.
   */
  generateModifier() {
    const { modifier, modifiers, event } = this;
    const src = createSource();

    each(mod => {
      if (has(mod, modifiers.prevent)) src.add(`${event}.preventDefault();\n`);
      else if (has(mod, modifiers.stop)) src.add(`${event}.stopPropagation();\n`);
      else if (has(mod, modifiers.control)) src.add(`if (!${event}.${mod}Key) return;\n`);
      else if (has(mod, modifiers.process))
        src.add(`if (${event}.key != '${this.adaptModifier(mod)}') return;\n`);
      else if (mod == modifiers.delete)
        src.add(`if (${event}.key != 'Backspace' && ${event}.key != 'Delete') return;\n`);
    }, modifier);

    return src.toString();
  }

  /**
   * Adapts a modifier string to its corresponding key name.
   * @param {string} modifier - The modifier to adapt.
   * @returns {string} - The adapted modifier.
   */
  adaptModifier(modifier) {
    // prettier-ignore
    switch (modifier) {
      case 'esc': return 'Escape';
      case 'space': return RAW_WHITESPACE;
      case 'up': return 'ArrowUp';
      case 'down': return 'ArrowDown';
      case 'left': return 'ArrowLeft';
      case 'right': return 'ArrowRight';
      default: return ucfirst(modifier);
    }
  }

  /**
   * Generates the arguments for the own function.
   * @returns {string} - The generated arguments.
   */
  ownArguments() {
    let { own, reference, event } = this;
    if (own.argument) {
      each((arg, index) => {
        if (arg == $event) own.arguments[index] = event;
        if (arg == $element) own.arguments[index] = reference;
      }, own.arguments);
      return join(RAW_COMMA, own.arguments);
    }
    return RAW_EMPTY;
  }
}
