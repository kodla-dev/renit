import { clone } from '../../../helpers/index.js';
import { filter, map, some } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { ElementDivPattern } from '../utils/constant.js';
import {
  isElementNode,
  isGhostElement,
  isMarkupElement,
  isStyle,
  nodeChildrenTrim,
} from '../utils/node.js';
import { addThisStyleAttribute, prepareStyle } from '../utils/style.js';

export default {
  /**
   * Compilation function for Document nodes.
   */
  Document({ node, template, component, compile, options }) {
    // Trims children nodes of invisible elements
    nodeChildrenTrim(node);

    // Ensure a single root element
    if (
      size(filter(child => isMarkupElement(child), node.children)) > 1 ||
      size(filter(child => isGhostElement(child), node.children)) >= 1
    ) {
      const div = clone(ElementDivPattern);
      div.children = node.children;

      // Add a method to check if the div has a stylesheet
      div.has = fn => {
        return some(child => fn(child), div.children);
      };

      node.children = [div];
    }

    // Filter out style elements at the root level
    const rootStyle = filter(child => isStyle(child), node.children);

    if (size(rootStyle) || options.$.external.style) {
      // external style
      let content;
      if (options.$.external.style) {
        content = options.$.external.style;
      } else {
        content = rootStyle[0].content;
      }
      // Prepare the style content
      const style = prepareStyle(content, options);
      if (!isEmpty(style.raw)) {
        component.appendStyle(style.raw);
        component.addChangedStyles(style.changedStyles);

        // Add the 'this' style attribute to the root element
        const element = node.children.find(child => isElementNode(child));
        addThisStyleAttribute(element, style);
      }
    }

    // Compile each child node of the Document
    map(child => compile(child), node.children);

    // Generate the template structure after compiling all children.
    return template.generate();
  },
};
