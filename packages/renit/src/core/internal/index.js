import { has } from '../../libraries/collect/index.js';
import {
  effect as effects,
  reactive as reactives,
  ref as refs,
} from '../../libraries/store/index.js';
import { DOM_REFER_SELECTOR } from '../define.js';
import { Document, fragment, references } from './dom.js';
import { blockPart, partWrapper } from './utils.js';

export function component(init) {
  return () => {
    const $ = {};
    init = init.call($);
    return init;
  };
}

/**
 * Parses the given HTML string and returns an array containing the HTML element and its references.
 * @param {string} html The HTML string to parse.
 * @param {boolean} [part] Indicates whether to wrap the HTML as a part.
 * @returns {Array} An array containing the HTML element and its references.
 */
export function block(html, part) {
  // Check if the HTML contains the dom reference selector.
  const selector = has(DOM_REFER_SELECTOR, html);

  let start,
    end,
    refer = [];

  // Wrap the HTML if the 'part' flag is set.
  if (part) html = partWrapper(html);

  // Convert the HTML string to a DocumentFragment.
  html = fragment(html);

  // Get the start and end parts of the HTML if 'part' flag is set.
  if (part) [start, end] = blockPart(html);

  // Set up location properties.
  /* l = location | l.s = start part | l.e = end part */
  html.l = {
    s: part ? start : html,
    e: part ? end : html,
  };

  // If the HTML contains the dom reference selector, create references.
  if (selector) {
    refer = references(html);
  }

  // Return an array containing the HTML element and its references.
  return [html, ...refer];
}

/**
 * Creates a reactive object with the provided initial value.
 * @param {*} initial The initial value of the reactive object.
 * @returns {Object} The reactive object.
 */
export function reactive(initial) {
  return reactives(initial);
}

/**
 * Creates a reactive reference with the provided initial value.
 * @param {*} initial The initial value of the reference.
 * @returns {Ref} The reactive reference.
 */
export function ref(initial) {
  return refs(initial);
}

/**
 * Executes the provided function as an effect.
 * @param {Function} fn The function to execute as an effect.
 */
export function effect(fn) {
  effects(fn);
}

/**
 * Represents the 'click' event.
 * @type {string}
 */
export const _click = 'click';

/**
 * Represents the 'value' property.
 * @type {string}
 */
export const _value = 'value';

/**
 * Represents the 'input' event.
 * @type {string}
 */
export const _input = 'input';

/**
 * Represents the 'checked' property name.
 * @type {string}
 */
export const _checked = 'checked';

/**
 * Adds an event listener to the specified element.
 * @param {HTMLElement} element - The HTML element to attach the event listener to.
 * @param {string} event - The name of the event.
 * @param {function} callback - The callback function to be executed when the event occurs.
 */
export function addEvent(element, event, callback) {
  if (!callback) return;
  element.addEventListener(event, callback);
}

/**
 * Sets the text content of the specified node.
 * @param {Node} node The node to set the text content for.
 * @param {string} text The text content to set.
 */
export function text(node, text) {
  node.textContent = text;
}

/**
 * Binds text content of a node to a reactive function.
 * @param {Node} node - The node whose text content will be bound.
 * @param {function} fn - The reactive function providing the text content.
 */
export function bindText(node, fn) {
  effect(() => {
    text(node, fn());
  });
}

/**
 * Binds an input element's value to a reactive property.
 * @param {HTMLInputElement} element - The input element to bind.
 * @param {string} name - The name of the property to bind (e.g., 'value').
 * @param {function} get - The reactive getter function.
 * @param {function} set - The reactive setter function.
 */
export function bindInput(element, name, get, set) {
  effect(() => {
    element[name] = get();
  });
  addEvent(element, _input, () => {
    set(element[name]);
  });
}

/**
 * Renders a view into a container.
 * @param {function} view - The view function to render.
 * @param {HTMLElement} container - The container element to append the view to.
 */
export function render(view, container) {
  container = Document.body;
  container.appendChild(view());
}
