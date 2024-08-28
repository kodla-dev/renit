import { safe } from '../common.js';
import { current, setContext, setCurrent } from '../share.js';

/**
 * Creates a server-side rendered component function that initializes and manages component context.
 *
 * @param {Function} init - Function to initialize the component.
 * @returns {Function} A function that takes options and returns the component.
 */
export function ssrComponent(init) {
  return (options = {}) => {
    setContext(options.context || {}); // Set the component context
    let prev = current; // Preserve the previous component state
    let component = { options };
    setCurrent(component); // Set the current component

    try {
      component.dom = init(options); // Initialize component DOM
    } finally {
      setCurrent(prev); // Restore the previous component state
      setContext(null); // Clear the context
    }

    return component;
  };
}

/**
 * Calls a server-side rendered component, initializes it, and appends its DOM to a parent string.
 *
 * @param {string} parent - The parent string to append the component DOM to.
 * @param {Function} component - Component initialization function.
 * @param {Object} context - The context for the component.
 * @param {Object} [option={}] - Additional options for the component.
 * @returns {string} The parent string with the component DOM appended.
 */
export function ssrCall(parent, component, context, option = {}) {
  option.context = { ...context }; // Merge context into options
  let c = safe(() => component(option)); // Safely initialize the component
  return parent + c.dom; // Append the component DOM to the parent string
}
