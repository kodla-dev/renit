import { map } from '../../../libraries/collect/index.js';
import { isArray } from '../../../libraries/is/index.js';
import { DOM_TEXT_SELECTOR } from '../../define.js';
import { TextSpot } from '../spot/text.js';
import { $var } from '../utils/index.js';
import { compactTextNode } from '../utils/node.js';

export default {
  /**
   * Processes a general text node, compiling its children if it's an array,
   * or handling its content as a block.
   */
  Text({ node, figure, compile }) {
    if (isArray(node.content)) {
      map(child => compile(child), node.content);
      return;
    }

    figure.appendBlock(compactTextNode(node));
  },

  /**
   * Processes a string text node, adding its content as a block to the figure.
   */
  StringText({ node, figure }) {
    figure.appendBlock(node.content);
  },

  /**
   * Processes a text node containing curly braces, adding its reference,
   * content, and dependencies to the figure.
   */
  CurlyBracesText({ node, component, figure }) {
    if (node.static) {
      figure.appendBlock($var(node.content));
      return;
    }

    node.reference = figure.addReference(node);
    figure.appendBlock(DOM_TEXT_SELECTOR);
    component.addDependencies(node.dependencies, node.content);
    figure.addSpot(new TextSpot(node));
  },
};
