import { join, push } from '../../../libraries/collect/index.js';
import { RAW_COMMA } from '../../define.js';
import { $el, $lamb } from '../utils/index.js';

export class ActionSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
    this.value = node.value;
    this.parameters = [];
  }

  generate() {
    this.init();
    const args = this.generateArguments();
    return `$.Action(${args});`;
  }

  init() {
    const { reference } = this;
    this.reference = $el(reference);
  }

  generateArguments() {
    const { reference, name, value, parameters } = this;
    push(reference, parameters);
    push(name, parameters);

    if (value) {
      push($lamb(`[${value}]`), parameters);
    }

    return join(RAW_COMMA, parameters);
  }
}
