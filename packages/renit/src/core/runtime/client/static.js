import { block } from './block.js';
import { _class } from './const.js';
import { unMount } from './share.js';
import { toggleClass } from './utils.js';

/**
 * Sets the attribute of an element.
 * If the attribute is a property of the element, it sets the property directly,
 * otherwise, it sets the attribute using setAttribute method.
 *
 * @param {HTMLElement} element The element to set the attribute on.
 * @param {string} name The name of the attribute.
 * @param {string} value The value of the attribute.
 */
export function attribute(element, name, value) {
  if (name in element) {
    element[name] = value;
  } else {
    element.setAttribute(name, value);
  }
}

/**
 * Adds an event listener to an element, binding its callback to a reactive function.
 *
 * @param {Element} element - The element to which the event listener will be added.
 * @param {string} type - The event type (e.g., 'click', 'input').
 * @param {function} callback - The callback function to execute when the event occurs.
 */
export function event(element, type, callback) {
  if (!callback) return;
  element.addEventListener(type, callback);

  unMount(() => {
    element.removeEventListener(type, callback);
  });
}

/**
 * Sets up event delegation on a root element or a document fragment.
 *
 * @param {Node} root - The root element or document fragment to delegate events from.
 * @returns {Function} - A function to bind event listeners on specified targets.
 */
export function rootEvent(root) {
  let events = {};
  let nodes = [];

  // Determine the nodes to delegate events to
  if (root.nodeType == 11) {
    // Document Fragment
    let n = root.firstElementChild;
    while (n) {
      nodes.push(n);
      n = n.nextElementSibling;
    }
  } else nodes = [root]; // Single Element

  // Clean up event listeners on unmount
  unMount(() => {
    for (let eventName in events) {
      nodes.forEach(n => n.removeEventListener(eventName, events[eventName]));
    }
  });

  // Event binding function
  return (target, eventName, callback) => {
    const key = `_$$${eventName}`;

    // Set up event listener if not already set
    if (!events[eventName]) {
      let handler = (events[eventName] = $event => {
        let top = $event.currentTarget;
        let el = $event.target;
        while (el) {
          el[key]?.($event);
          if (el == top || $event.cancelBubble) break;
          el = el.parentNode;
        }
      });
      nodes.forEach(n => n.addEventListener(eventName, handler));
    }

    // Attach callback to target element
    target[key] = callback;
  };
}

/**
 * Sets the HTML content of a DOM node by replacing it with new content.
 *
 * @param {Node} node - The DOM node to be replaced.
 * @param {string} content - The HTML content to set on the DOM node.
 */
export function html(node, content) {
  node.replaceWith(block(content));
}

/**
 * Modifies a DOM node's attribute based on a condition.
 *
 * @param {Node} node - The DOM node to modify.
 * @param {string} name - The name of the class or attribute to modify.
 * @param {string} dependent - The class or attribute value to modify.
 * @param {boolean} condition - The condition to determine if the modification should occur.
 */
export function modifier(node, name, dependent, condition) {
  let fn;

  if (name == _class) {
    fn = toggleClass;
  }

  fn(node, condition, dependent);
}

/**
 * Modifies a DOM node's class or attribute based on a condition for each dependent value.
 *
 * @param {Node} node - The DOM node to modify.
 * @param {string} name - The name of the class or attribute to modify.
 * @param {string[]} dependent - The array of class or attribute values to modify.
 * @param {boolean} condition - The condition to determine if the modifications should occur.
 */
export function modifiers(node, name, dependent, condition) {
  let fn;

  if (name == _class) {
    fn = toggleClass;
  }

  dependent.forEach(value => fn(node, condition, value));
}

/**
 * Sets the text content of a DOM node.
 *
 * @param {Node} node - The DOM node whose text content needs to be set.
 * @param {string} content - The text content to set on the DOM node.
 */
export function text(node, content) {
  node.textContent = content;
}
