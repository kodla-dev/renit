import { safe } from '../common.js';
import { current, setContext, setCurrent, share } from '../share.js';
import { watch } from './reactive.js';
import { append, compare, fire } from './utils.js';

/**
 * Creates a component function that initializes and manages component context.
 *
 * @param {Function} init - Function to initialize the component.
 * @returns {Function} A function that takes options and returns the component.
 */
export function component(init) {
  return (option = {}) => {
    setContext(option.context || {}); // Set the component context
    let prev = current; // Preserve the previous component state
    let prevCD = share.cd; // Preserve the previous context data
    let component = { option };
    setCurrent(component); // Set the current component
    share.cd = null; // Clear shared context data

    try {
      component.dom = init(option); // Initialize component DOM
    } finally {
      setCurrent(prev); // Restore the previous component state
      share.cd = prevCD; // Restore the previous context data
      setContext(null); // Clear the context
    }

    return component;
  };
}

/**
 * Initializes a component with the given context and options.
 *
 * @param {Function} component - Component initialization function.
 * @param {Object} context - The context for the component.
 * @param {Object} [option={}] - Additional options for the component.
 * @returns {Object} The initialized component.
 */
function init(component, context, option = {}) {
  option.context = { ...context }; // Create a new context object
  let c = safe(() => component(option)); // Safely initialize the component
  return c;
}

/**
 * Calls a component, initializes it, and appends its DOM to a node.
 *
 * @param {HTMLElement} node - The DOM node to append the component to.
 * @param {Function} component - Component initialization function.
 * @param {Object} context - The context for the component.
 * @param {Object} [option={}] - Additional options for the component.
 */
export function call(node, component, context, option = {}) {
  const c = init(component, context, option); // Initialize the component
  checkForKit(c);
  append(node, c.dom); // Append the component DOM to the node
  return c;
}

/**
 * Dynamically initializes a component with context and options, and watches properties.
 *
 * @param {HTMLElement} node - The DOM node to append the component to.
 * @param {Function} component - Component initialization function.
 * @param {Object} context - The context for the component.
 * @param {Object} [option={}] - Additional options for the component.
 * @param {Object} [props={}] - Properties to watch for updates.
 * @param {Function} [ch] - Optional callback for change handling.
 * @returns {Object} The initialized component.
 */
export function callDyn(node, component, context, option = {}, props, ch) {
  let c, pw;

  if (props) {
    pw = watch(
      props,
      value => {
        c.apply?.(value); // Apply property updates
        c.update?.(); // Trigger component update
      },
      { v: {}, idle: true, ch }
    );
    pw = pw[0];
    option.props = fire(pw); // Fire updates for watched properties
  }

  c = init(component, context, option); // Initialize the component
  checkForKit(c);
  append(node, c.dom); // Append the component DOM to the node
  return c;
}

function checkForKit(c) {
  if (c?.c) watch(c.c, () => c.update(), { v: {}, idle: true, ch: compare });
}
