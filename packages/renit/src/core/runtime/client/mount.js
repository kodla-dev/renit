import { safeMulti } from '../common.js';
import { share } from '../share.js';

/**
 * Mounts a component to a target DOM element and manages lifecycle hooks.
 *
 * @param {HTMLElement} target - The DOM element to mount the component to.
 * @param {Function} component - The component initialization function.
 * @param {Object} option - Options to pass to the component.
 * @returns {Object} The mounted component with a destroy method.
 */
export function mount(target, component, option) {
  let app;
  let unmount = (share.unmount = []); // Initialize unmount hooks
  share.mount = []; // Initialize mount hooks

  try {
    app = component(option); // Create and initialize the component
    let dom = app.dom;
    delete app.dom; // Remove the DOM reference from the component
    target.innerHTML = ''; // Clear the target element's content
    target.appendChild(dom); // Append the component's DOM to the target
    safeMulti(share.mount, unmount); // Execute mount hooks
  } finally {
    share.unmount = share.mount = null; // Clean up hooks references
  }

  // Add a destroy method to the component to clean up unmount hooks
  app.destroy = () => {
    safeMulti(unmount);
  };

  return app; // Return the mounted component
}
