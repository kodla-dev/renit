import { filter, map } from '../../../libraries/collect/index.js';
import { isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { DOM_ELEMENT_SELECTOR, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { Component } from '../template/component.js';
import { addThisStyleAttribute, prepareStyle } from '../utils/ast.js';
import { isStyle } from '../utils/index.js';

export default {
  /**
   * Processes a node and converts it into a component fragment.
   */
  Fragment({ node, template, compile, options }) {
    let fragment;

    // Check if node has parameters and extract the fragment if present
    if (node.params) {
      if (node.params.fragment) {
        fragment = node.params.fragment;
      }
    }

    // If no fragment is found, exit the function
    if (isUndefined(fragment)) return;

    // Create a new component with the fragment and options
    const component = new Component(fragment, options);

    // Filter out style elements at the root level
    const rootStyle = filter(child => isStyle(child), node.children);

    if (size(rootStyle)) {
      // Prepare the style content
      const style = prepareStyle(rootStyle[0].content, options);
      if (!isEmpty(style.raw)) {
        component.appendStyle(style.raw);
        component.addChangedStyles(style.changedStyles);

        // Add the 'this' style attribute to the root element
        addThisStyleAttribute(node, style);
      }
    }

    // If node has parameters, add reference and append block if reference is present
    if (node.params) {
      if (node.params.reference) {
        node.reference = component.addReference(node);
        component.appendBlock(DOM_ELEMENT_SELECTOR);
      }
    }

    // Determine the appropriate spacing based on whether node has attributes
    const emptyAttributes = isEmpty(node.attributes);
    const space = emptyAttributes ? RAW_EMPTY : RAW_WHITESPACE;

    // Append the opening tag of the element
    component.appendBlock('<' + node.name + space);

    // Compile and append each attribute
    map(child => compile(child, component), node.attributes);

    // If there are attributes, trim the last block
    if (!emptyAttributes) component.trimBlock();

    // Append closing slash for void elements, otherwise append closing tag
    component.appendBlock(node.voidElement ? '/>' : '>');

    // Compile and append each child node
    map(child => compile(child, component), node.children);

    // Append the closing tag if the element is not void
    if (!node.voidElement) component.appendBlock('</' + node.name + '>');

    // Add the completed component to the template
    template.addComponent(component);
  },
};
