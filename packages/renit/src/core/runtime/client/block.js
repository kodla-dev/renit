import { size } from '../../../libraries/math/index.js';
import { RAW_TEMPLATE } from '../../define.js';
import { childNodes, firstChild, innerElement } from './dom.js';

/**
 * Extracts the block content from the provided HTML.
 * @param {string} html The HTML string representing the block.
 * @returns {DocumentFragment|Node} The content of the block.
 */
export function block(html) {
  let template = innerElement(RAW_TEMPLATE, html);
  let content = template.content;
  if (size(childNodes(content)) == 1) {
    content = firstChild(content);
  }
  return content;
}
