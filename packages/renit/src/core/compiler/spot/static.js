import { each } from '../../../libraries/collect/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { $el, $escape, $ltr, $var, adaptDefine } from '../utils/index.js';
import {
  isBracesAttribute,
  isBracesText,
  isClassAttribute,
  isClassOrIdAttribute,
  isElementNode,
  isStringAttribute,
  isTextNode,
} from '../utils/node.js';
import { updateStyleAttribute } from '../utils/style.js';

export class StaticSpot {
  constructor(parent, node, ssr) {
    this.node = node;
    this.parent = parent;
    this.ssr = ssr;
    this.type = RAW_EMPTY;
    this.reference = RAW_EMPTY;
    this.content = RAW_EMPTY;
    this.attribute = RAW_EMPTY;
  }

  generate(component) {
    this.init(component);
    if (this.ssr) {
      const order = this.node.params.order;
      const space = order > 0 ? RAW_WHITESPACE : RAW_EMPTY;
      return `$parent += ${$ltr(space + this.node.name + '="')} + ${$escape(this.content)} + '"';`;
    } else {
      if (this.type == 'text') {
        return `$.text(${$el(this.reference)},${this.content});`;
      } else if (this.type == 'element') {
        return `$.attribute(${$el(this.reference)},${this.attribute},${this.content});`;
      }
    }
  }

  init(component) {
    let { parent, node, content, type } = this;

    if (isTextNode(parent)) {
      type = 'text';
    } else if (isElementNode(parent)) {
      type = 'element';
    }

    if (type == 'text') {
      content = node.content;
    } else if (type == 'element') {
      each(value => {
        if (isStringAttribute(value)) {
          if (isClassOrIdAttribute(node)) {
            let type = 'id';
            if (isClassAttribute(node)) type = 'class';
            // Update style name if the attribute is a id or class attribute
            content += updateStyleAttribute(
              value.content,
              type,
              component.changedStyles,
              component.options.component
            );
          } else {
            content += value.content;
          }
        } else if (isBracesAttribute(value)) {
          content += $var(value.content.trim());
        }
      }, node.value);
      content = $ltr(content);
      this.attribute = adaptDefine(node.name);
    }

    this.type = type;
    this.content = content;
    this.reference = isBracesText(node) ? node.reference : parent.reference;
  }
}
