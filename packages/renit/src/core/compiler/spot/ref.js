import { $el } from '../utils/index.js';

export class RefSpot {
  constructor(parent, node) {
    this.reference = parent.reference;
    this.name = node.name;
  }
  generate() {
    const el = $el(this.reference);
    const name = this.name;
    let src = `${name} = ${el};\n`;
    src += `$.unMount(() => ${name} = null);`;
    return src;
  }
}
