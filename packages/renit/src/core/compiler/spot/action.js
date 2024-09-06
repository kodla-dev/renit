import { has, join, push } from '../../../libraries/collect/index.js';
import { RAW_COMMA } from '../../define.js';
import { createSource } from '../source.js';
import { $element } from '../utils/constant.js';
import { $el, $lamb } from '../utils/index.js';
import { javaScriptSyntaxCorrection } from '../utils/script.js';

export class ActionSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
    this.value = node.value;
    this.parameters = [];
  }

  generate() {
    this.init();

    let { name, value, reference } = this;
    if (name == '*') {
      const src = createSource();
      src.add(`$.tick(() => {\n`);
      if (has($element, value)) value = value.replace($element, reference);
      src.add(javaScriptSyntaxCorrection(value));
      src.add(`});`);
      return src.toString();
    } else {
      const args = this.generateArguments();
      return `$.Action(${args});`;
    }
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
