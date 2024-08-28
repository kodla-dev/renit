import { $ltr } from '../utils/index.js';

export class BlockSpot {
  constructor(id, figure = false) {
    this.id = id;
    this.figure = figure;
  }
  generate(component) {
    const { id, figure } = this;
    let block;

    if (figure) {
      block = figure.block[id];
    } else {
      block = component.block[id];
    }

    if (block) {
      return `$parent += ${$ltr(block)};`;
    }
  }
}
