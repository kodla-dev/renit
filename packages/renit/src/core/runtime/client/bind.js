import { isEmpty, isFunction } from '../../../libraries/is/index.js';
import { block } from './block.js';
import { _input, _textContent } from './const.js';
import { addEventListener, replaceWith, setAttribute } from './dom.js';
import { watch } from './reactive.js';

/**
 * Sets the attribute of an element.
 * If the attribute is a property of the element, it sets the property directly,
 * otherwise, it sets the attribute using setAttribute method.
 *
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
 *
 * @param {Object} context - The context for reactive binding.
 * @param {Element} element - The element on which the attribute will be set.
 * @param {string} name - The name of the attribute.
 * @param {any} value - The value to set for the attribute.
 * @param {...any} dependencies - Dependencies that determine when the content should be updated.
 */
export function attribute(context, element, name, value, ...dependencies) {
  // If dependencies are empty, set them to the value
  if (isEmpty(dependencies)) dependencies = [value];

  if (isFunction(value)) {
    watch(
      context,
      value,
      newValue => {
        _attribute(element, name, newValue);
      },
      dependencies
    );
  } else {
    _attribute(element, name, value);
  }
}

/**
 * Adds an event listener to an element, binding its callback to a reactive function.
 *
 * @param {Object} context - The context for reactive binding.
 * @param {Element} element - The element to which the event listener will be added.
 * @param {string} type - The event type (e.g., 'click', 'input').
 * @param {function} callback - The callback function to execute when the event occurs.
 */
export function event(context, element, type, callback) {
  if (!callback) return;
  addEventListener(element, type, callback);
  // TODO: add removeEventListener to context
}

/**
 * Binds an input element's attribute and event to reactive functions.
 *
 * @param {Object} context - The context for reactive binding.
 * @param {Element} element - The input element to bind.
 * @param {string} name - The name of the attribute to bind.
 * @param {function} get - The reactive function to retrieve the attribute value.
 * @param {function} set - The optional setter function to update the attribute value.
 */
export function input(context, element, name, get, set) {
  // Bind the attribute to a reactive function
  attribute(context, element, name, get);

  // If a setter function is provided, bind the 'input' event to update the attribute value
  if (set) {
    event(context, element, _input, () => {
      set(element[name]);
    });
  }
}

/**
 * Binds text content of a node to a reactive function or value.
 *
 * @param {Object} context - The context for reactive binding.
 * @param {Node} node - The node whose text content will be bound.
 * @param {function|string} content - The reactive function or value providing the text content.
 * @param {...Function} dependencies - Optional dependencies that trigger updates.
 */
export function text(context, node, content, ...dependencies) {
  // If dependencies are empty, set them to the content
  if (isEmpty(dependencies)) dependencies = [content];

  // If content is a function, watch its changes and update the text node reactively
  if (isFunction(content)) {
    watch(
      context,
      content,
      value => {
        _attribute(node, _textContent, value);
      },
      dependencies
    );
  } else {
    // Otherwise, set the text content directly
    _attribute(node, _textContent, content);
  }
}

/**
 * Updates the HTML content of a given node.
 *
 * @param {Object} context - The context in which the function operates.
 * @param {HTMLElement} node - The DOM node to be updated.
 * @param {Function|string} content - The new content to be set. Can be a function or a string.
 * @param {...any} dependencies - Dependencies that determine when the content should be updated.
 */
export function html(context, node, content, ...dependencies) {
  // If dependencies are not provided, use content as the dependency
  if (isEmpty(dependencies)) dependencies = [content];

  // If content is a function, set up a watcher to update the node when content changes
  if (isFunction(content)) {
    watch(
      context,
      content,
      value => {
        const element = block(value);
        replaceWith(node, element);
        node = element;
      },
      dependencies
    );
  } else {
    // If content is not a function, directly replace the node's content
    replaceWith(node, block(content));
  }
}
