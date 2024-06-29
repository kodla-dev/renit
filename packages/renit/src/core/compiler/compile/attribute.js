import { pipe } from '../../../helpers/index.js';
import { each, filter, map, some } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_WHITESPACE } from '../../define.js';
import { AttributeSpot } from '../spot/attribute.js';
import { EventSpot } from '../spot/event.js';
import { InputSpot } from '../spot/input.js';
import { javaScriptToAST, updateStyleAttribute } from '../utils/ast.js';
import {
  $str,
  $var,
  hasSuffix,
  isClassAttribute,
  isCurlyBracesAttribute,
  isPrefixBind,
  isPrefixLine,
  isStringAttribute,
} from '../utils/index.js';

export default {
  /**
   * Compiles an attribute node, updating styles and generating the appropriate attribute string.
   */
  Attribute({ parent, node, figure, compile }) {
    let { name, value } = node;
    if (isArray(value)) {
      // Check if all values are static
      const onlyStatic = !some(
        val => isCurlyBracesAttribute(val) && val.static == false,
        node.value
      );

      if (onlyStatic) {
        let content = '';
        each(value => {
          if (isStringAttribute(value)) {
            if (isClassAttribute(node)) {
              // Update style name if the attribute is a class attribute
              content += updateStyleAttribute(value.content, figure.changedStyles);
            } else {
              content += value.content;
            }
          } else if (isCurlyBracesAttribute(value)) {
            content += $var(value.content.trim());
          }
        }, value);
        figure.appendBlock(name + '=');
        figure.appendBlock($str(content));
        figure.appendBlock(RAW_WHITESPACE);
        return;
      }

      // Compile child nodes and add a new attribute spot to the figure
      map(child => compile(child), node.value);
      figure.addSpot(new AttributeSpot(parent, node));
      return;
    }

    const hasValue = !isUndefined(value);
    figure.appendBlock(name);
    if (hasValue) {
      if (isClassAttribute(node)) {
        figure.appendBlock('=' + $str(updateStyleAttribute(value, figure.changedStyles)));
      } else {
        figure.appendBlock('=' + $str(value));
      }
    }
    figure.appendBlock(RAW_WHITESPACE);
  },

  /**
   * Compiles a curly braces attribute node, adding dependencies to the figure.
   */
  CurlyBracesAttribute({ node, figure }) {
    figure.addDependencies(node.dependencies, node.content);
  },

  /**
   * Compiles an event attribute node, handling modifiers and event handlers.
   */
  EventAttribute({ parent, node, figure }) {
    let { name, value } = node;
    let handler = value;
    let modifier = [];
    let isSuffix = hasSuffix(node);

    if (isArray(value)) {
      handler = value[0].content;

      if (handler == name && isSuffix) {
        const bind = filter(item => isPrefixBind(item), node.suffix);
        if (!isEmpty(bind)) handler = bind[0].name;
        node.value[0].expression = javaScriptToAST(handler).body[0].expression;
      }
    }

    if (isSuffix) {
      modifier = pipe(
        node.suffix,
        filter(item => isPrefixLine(item)),
        map(item => item.name)
      );
    }

    figure.addSpot(new EventSpot(parent, node, modifier, handler));
  },
  /**
   * Processes a bind attribute node.
   */
  BindAttribute({ parent, node, figure }) {
    figure.addUpdatedDependencies(node.value[0].content.trim());
    figure.addSpot(new InputSpot(parent, node));
  },
};
