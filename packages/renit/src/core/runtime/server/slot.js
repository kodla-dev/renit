/**
 * Renders a slot in SSR for a component or a placeholder if the slot is missing.
 *
 * @param {string} parent - The parent string to append the content to.
 * @param {string} name - The name of the slot.
 * @param {Object} component - The component containing the slot.
 * @param {Object} context - The context to pass to the slot.
 * @param {Object} props - The props to pass to the slot.
 * @param {Function} placeholder - A function to call if the slot is missing.
 * @returns {string} - The updated parent string.
 */
export function ssrSlot(parent, name, component, context, props, placeholder) {
  let slot = component.option?.slots?.[name || 'default'];
  const block = slot ? slot(context, props) : placeholder?.();
  if (block) parent = parent + block;
  else parent = parent.trim();
  return parent;
}
