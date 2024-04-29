import { isFunction } from '../../libraries/is/index.js';
import { _input, _textContent } from './const.js';
import { addEventListener, setAttribute } from './dom.js';
import { reactive } from './reactive.js';

/**
 * Sets the attribute of an element.
 * If the attribute is a property of the element, it sets the property directly,
 * otherwise, it sets the attribute using setAttribute method.
 * @param {HTMLElement} element The element to set the attribute on.
 * @param {string} name The name of the attribute.
 * @param {string} value The value of the attribute.
 */
function _attribute(element, name, value) {
  if (name in element) {
    element[name] = value;
  } else {
    setAttribute(element, name, value);
  }
}

/**
 * Sets an attribute on an element, binding its value to a reactive function if the value is a function.
 * @param {Object} self - The context for reactive binding.
 * @param {Element} element - The element on which the attribute will be set.
 * @param {string} name - The name of the attribute.
 * @param {any} value - The value to set for the attribute.
 */
export function attribute(self, element, name, value) {
  if (isFunction(value)) {
    reactive(self, value, value => {
      _attribute(element, name, value);
    });
  } else {
    _attribute(element, name, value);
  }
}

/**
 * Adds an event listener to an element, binding its callback to a reactive function.
 * @param {Object} self - The context for reactive binding.
 * @param {Element} element - The element to which the event listener will be added.
 * @param {string} event - The event type (e.g., 'click', 'input').
 * @param {function} callback - The callback function to execute when the event occurs.
 */
export function event(self, element, event, callback) {
  if (!callback) return;
  addEventListener(element, event, callback);
}

/**
 * Binds an input element's attribute and event to reactive functions.
 * @param {Object} self - The context for reactive binding.
 * @param {Element} element - The input element to bind.
 * @param {string} name - The name of the attribute to bind.
 * @param {function} get - The reactive function to retrieve the attribute value.
 * @param {function} set - The optional setter function to update the attribute value.
 */
export function input(self, element, name, get, set) {
  // Bind the attribute to a reactive function
  attribute(self, element, name, get);

  // If a setter function is provided, bind the 'input' event to update the attribute value
  if (set) {
    event(self, element, _input, () => {
      set(element[name]);
    });
  }
}

/**
 * Binds text content of a node to a reactive function or value.
 * @param {Object} self - The context for reactive binding.
 * @param {Node} node - The node whose text content will be bound.
 * @param {function|string} content - The reactive function or value providing the text content.
 */
export function text(self, node, content) {
  // If content is a function, bind it to a reactive update of the text content
  if (isFunction(content)) {
    reactive(self, content, value => {
      _attribute(node, _textContent, value);
    });
  } else {
    // Otherwise, set the text content directly
    _attribute(node, _textContent, content);
  }
}
