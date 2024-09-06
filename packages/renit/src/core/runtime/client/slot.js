import { share, unMount } from '../share.js';
import { block } from './block.js';
import { Watch, addCD, componentCD, newCD, removeCD } from './reactive.js';
import { append, fire } from './utils.js';

/**
 * Renders a slot in a container using a component's defined slots or a placeholder.
 * @param {HTMLElement} container - The container element to append the slot's content.
 * @param {string} name - The name of the slot to render (default slot if not provided).
 * @param {Object} component - The component that defines the slot.
 * @param {Object} context - The context in which the slot is rendered.
 * @param {Object} props - Properties to pass to the slot.
 * @param {Function} [placeholder] - A placeholder function to render if the slot is not defined.
 */
export function slot(container, name, component, context, props, placeholder) {
  let slot = component.option.slots?.[name || 'default'];
  const block = slot ? slot(component, context, props) : placeholder?.();
  if (block) append(container, block[0]);
}

/**
 * Dynamically renders a slot in a container, allowing for reactive updates.
 * @param {HTMLElement} container - The container element to append the slot's content.
 * @param {string} name - The name of the slot to render (default slot if not provided).
 * @param {Object} component - The component that defines the slot.
 * @param {Object} context - The context in which the slot is rendered.
 * @param {Object} props - Properties to watch for changes and pass to the slot.
 * @param {Function} [placeholder] - A placeholder function to render if the slot is not defined.
 * @param {any} ch - A change handler or reference to handle updates.
 */
export function slotDyn(container, name, component, context, props, placeholder, ch) {
  let slot = component.option.slots?.[name || 'default'];
  let block;
  if (slot) {
    let push;
    let w = new Watch(
      props,
      value => {
        if (push) push(value);
      },
      props
    );
    Object.assign(w, { v: {}, ch, idle: true });
    fire(w);
    block = slot(component, context, w.v);
    let p;
    if ((p = block[1])) {
      push = p;
      share.cd.watch.push(w);
    }
  } else {
    block = placeholder?.();
  }
  if (block) append(container, block[0]);
}

/**
 * Creates a slot with cloned HTML content and processes it within a given context.
 * @param {string} html - The HTML content of the slot.
 * @param {Function} process - A function to process the slot's content within the context.
 * @returns {Function} A function to render the slot with its content, caller, and context.
 */
export function makeSlot(html, process) {
  let parentCD = share.cd;
  const content = block(html);
  return (caller, context, props) => {
    const block = content.cloneNode(true);
    const prev = share.cd;
    if (parentCD) {
      const cd = (share.cd = newCD());
      addCD(parentCD, cd);
      unMount(() => removeCD(cd));
      componentCD(parentCD).update();
    } else share.cd = null;
    try {
      return [block, process(block, context, caller, props)];
    } finally {
      share.cd = prev;
    }
  };
}
