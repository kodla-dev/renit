import { includes, map } from '../../../libraries/collect/index.js';
import { isArray } from '../../../libraries/is/index.js';
import { DOM_TEXT_SELECTOR, RAW_WHITESPACE, RGX_WHITESPACE } from '../../define.js';
import { TextSpot } from '../spot/text.js';
import { simpleBracesConvert } from '../utils/braces.js';
import { $el, $ltr, $var } from '../utils/index.js';
import { compactTextNode, isSSR } from '../utils/node.js';

export default {
  /**
   * Processes a general text node, compiling its children if it's an array,
   * or handling its content as a block.
   */
  Text({ node, figure, compile }) {
    if (RGX_WHITESPACE.test(node.content)) {
      figure.appendBlock(RAW_WHITESPACE);
      return;
    }

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
   * Processes a text node containing braces, adding its reference,
   * content, and dependencies to the figure.
   */
  BracesText({ node, component, figure, options }) {
    const ssr = isSSR(options);

    if (ssr) figure.startBlock();

    if (!ssr) {
      if (node.literals) {
        figure.appendBlock($var(node.content));
        return;
      }

      node.reference = figure.addReference();
      figure.appendBlock(DOM_TEXT_SELECTOR);
      component.addDependencies(node.dependencies, node.content);
    }

    figure.addSpot(new TextSpot(node, options));

    if (ssr) figure.endBlock();
  },

  BracketsText({ node, figure, template, options }) {
    const ssr = isSSR(options);

    const value = node.value;

    let fnName;
    if (node.link) {
      fnName = 'link';
      template.link = true;
    }
    if (node.translate) {
      fnName = 'translate';
      template.translate = true;
    }

    const fnValue = includes('(', value);
    let name, fn, param, dynamic; // prettier-ignore

    if (fnValue) {
      const open = value.indexOf('(');
      name = value.slice(0, open).trim();
      fn = value.slice(open).trim();
    } else {
      if (node.link) {
        dynamic = includes('{', value);
        node.value = dynamic ? simpleBracesConvert(value) : value;
      } else if (node.translate) {
        if (includes(':', value)) {
          const mark = value.indexOf(':');
          name = value.slice(0, mark).trim();
          param = value.slice(mark).trim().substring(1);
        }
      }
    }

    if (node.literals || ssr) {
      if (fnValue) {
        figure.appendBlock($var(`${fnName}(${$ltr(name)})${fn}`));
      } else {
        figure.appendBlock($var(`${fnName}(${$ltr(node.value)})`));
      }
      return;
    }

    node.reference = figure.addReference();
    figure.appendBlock(DOM_TEXT_SELECTOR);

    figure.addSpot({
      generate() {
        if (fnValue) {
          return `$.Text(${$el(node.reference)},()=>${fnName}(${$ltr(name)})${fn});`;
        } else if (param) {
          return `$.Text(${$el(node.reference)},()=>${fnName}(${$ltr(name)},${param}));`;
        } else {
          if (dynamic) {
            return `$.Text(${$el(node.reference)},()=>${fnName}(${$ltr(node.value)}));`;
          } else {
            return `$.text(${$el(node.reference)},${fnName}(${$ltr(node.value)}));`;
          }
        }
      },
    });
  },
};
