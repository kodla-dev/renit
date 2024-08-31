import { isFunction } from '../../../libraries/is/index.js';
import { onMount, unMount } from '../share.js';
import { block } from './block.js';
import { _input } from './const.js';
import { watch } from './reactive.js';
import { event, modifier, modifiers, text } from './static.js';
import { bindAttribute, cloned, compare } from './utils.js';

/**
 * Binds an attribute to a DOM element and sets up a watch on specified dependencies.
 *
 * @param {Element} element - The DOM element to bind the attribute to.
 * @param {string} name - The name of the attribute to bind.
 * @param {Function} value - Function to get the current value of the attribute.
 * @param {...Function} dependencies - Functions to get the dependencies to watch.
 */
export function Attribute(element, name, value, ...dependencies) {
  // Set up a watch on the specified dependencies
  watch(
    value,
    newValue => {
      // Bind the new value to the attribute
      bindAttribute(element, name, newValue);
    },
    undefined,
    dependencies
  );
}

/**
 * Binds an input element's attribute and event to reactive functions.
 *
 * @param {Element} element - The input element to bind.
 * @param {string} name - The name of the attribute to bind.
 * @param {function} get - The reactive function to retrieve the attribute value.
 * @param {function} set - The optional setter function to update the attribute value.
 */
export function Input(element, name, get, set) {
  // Bind the attribute to a reactive function
  Attribute(element, name, get);

  // If a setter function is provided, bind the 'input' event to update the attribute value
  if (set) {
    event(element, _input, () => {
      set(element[name]);
    });
  }
}

/**
 * Dynamically updates the text content of a DOM node and sets up a watch on specified dependencies.
 *
 * @param {Node} node - The DOM node to update the text content of.
 * @param {Function} content - Function to get the current text content.
 * @param {...Function} dependencies - Functions to get the dependencies to watch.
 */
export function Text(node, content, ...dependencies) {
  // Set up a watch on the specified dependencies
  watch(
    content,
    value => {
      // Update the text content of the node
      text(node, value);
    },
    undefined,
    dependencies
  );
}

/**
 * Dynamically updates the inner HTML of a DOM node and sets up a watch on specified dependencies.
 *
 * @param {Node} node - The DOM node to update the inner HTML of.
 * @param {Function} content - Function to get the current HTML content.
 * @param {...Function} dependencies - Functions to get the dependencies to watch.
 */
export function Html(node, content, ...dependencies) {
  // Set up a watch on the specified dependencies
  watch(
    content,
    value => {
      const element = block(value); // Create a new element with the content
      node.replaceWith(element); // Replace the old node with the new element
      node = element; // Update the reference to the node
    },
    undefined,
    dependencies
  );
}

/**
 * Dynamically updates a node's attribute based on a condition and sets up a watch on the specified dependencies.
 *
 * @param {Node} node - The DOM node to update.
 * @param {String} name - The name of the attribute to update.
 * @param {Any} dependent - The value of the attribute to update.
 * @param {Function} condition - A function that returns the condition to check.
 */
export function Modifier(node, name, dependent, condition) {
  // Set up a watch on the specified condition
  watch(condition, value => {
    // Update the node's attribute based on the condition
    modifier(node, name, dependent, value);
  });
}

/**
 * Dynamically updates a node's attributes based on a condition and sets up a watch on the specified dependencies.
 *
 * @param {Node} node - The DOM node to update.
 * @param {String[]} name - The name of the attribute to update.
 * @param {Any} dependent - The value of the attribute to update.
 * @param {Function} condition - A function that returns the condition to check.
 */
export function Modifiers(node, name, dependent, condition) {
  // Set up a watch on the specified condition
  watch(condition, value => {
    // Update the node's attributes based on the condition
    modifiers(node, name, dependent, value);
  });
}

/**
 * Executes an action on a DOM node, optionally based on dependent values.
 *
 * @param {HTMLElement} node - The DOM node on which the action is performed.
 * @param {Function} action - The action to be executed on the node.
 * @param {Function} [dependent] - An optional function that provides dependent values for the action.
 */
export function Action(node, action, dependent) {
  let handler, value;

  // If dependent values are provided, evaluate them and pass to the action
  if (dependent) {
    value = dependent();
    handler = action.apply(null, [node].concat(value));
  } else handler = action(node);

  // If the handler is a function, unmount it
  if (isFunction(handler)) unMount(handler);
  else {
    // Unmount if a destroy method is present
    unMount(handler?.destroy);

    // If an update method exists and there are dependent values, set up a watcher
    if (handler?.update && dependent) {
      watch(
        dependent,
        args => {
          handler.update.apply(handler, args);
        },
        { ch: compare, v: cloned(value) }
      );
    }

    // If an init method exists, call it on mount
    handler?.init && onMount(handler.init);
  }
}
