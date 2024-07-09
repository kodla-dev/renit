import { filter, map } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { DOM_ELEMENT_SELECTOR, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { isStyle } from '../utils/node.js';
import { addThisStyleAttribute, prepareStyle } from '../utils/style.js';

export default {
  /**
   * Compilation function for Element nodes.
   */
  Element({ node, component, figure, compile, options }) {
    // Check if the node has a stylesheet and process it if present.
    if (node.hasStyleSheet()) {
      const styles = filter(child => isStyle(child), node.children);
      if (size(styles)) {
        const style = prepareStyle(styles[0].content, options);
        if (!isEmpty(style.raw)) {
          component.appendStyle(style.raw);
          component.addChangedStyles(style.changedStyles);
          addThisStyleAttribute(node, style);
        }
      }
    }

    // If the node has parameters and the 'reference' parameter is set,
    // mark this node as a reference and perform operations related to this
    // reference on the 'figure' object.
    if (node.params) {
      if (node.params.reference) {
        node.reference = figure.addReference(node);
        figure.appendBlock(DOM_ELEMENT_SELECTOR);
      }
    }

    // Check if the element has empty attributes, determine the appropriate space string
    // based on whether attributes are empty or not.
    const isAttributesEmpty = isEmpty(node.attributes);
    const space = isAttributesEmpty ? RAW_EMPTY : RAW_WHITESPACE;

    // Start building the opening tag of the element.
    figure.appendBlock('<' + node.name + space);

    // Process the attributes of the element.
    map(child => compile(child), node.attributes);

    // If there are attributes, trim the block.
    if (!isAttributesEmpty) figure.trimBlock();

    // Close the opening tag of the element. If it's a self-closing void element,
    // use '/>', otherwise use '>'.
    figure.appendBlock(node.voidElement ? '/>' : '>');

    // Process the children of the element.
    map(child => compile(child), node.children);

    // If it's not a void element, close the element with a closing tag.
    if (!node.voidElement) {
      figure.appendBlock('</' + node.name + '>');
    }
  },
};
