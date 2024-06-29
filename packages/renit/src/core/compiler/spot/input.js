import { join, push } from '../../../libraries/collect/index.js';
import { RAW_COMMA } from '../../define.js';
import { $el, $lamb, $u, adaptDefine } from '../utils/index.js';

export class InputSpot {
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
