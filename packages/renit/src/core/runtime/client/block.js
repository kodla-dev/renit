import { size } from '../../../libraries/math/index.js';
import { RAW_TEMPLATE } from '../../define.js';
import {
  appendChild,
  childNodes,
  createElement,
  firstChild,
  innerElement,
  innerHTML,
  querySelector,
  setId,
} from './dom.js';

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

/**
 * Adds a style element with the specified id and content to the document head.
 * @param {string} id - The id to set on the style element.
 * @param {string} content - The CSS content to include in the style element.
 */
export function style(id, content) {
  if (querySelector(document.head, 'style#' + id)) return;
  let style = createElement('style');
  setId(style, id);
  innerHTML(style, content);
  appendChild(document.head, style);
}
