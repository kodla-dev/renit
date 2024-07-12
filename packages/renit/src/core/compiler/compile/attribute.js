import { pipe } from '../../../helpers/index.js';
import { diff, each, filter, map, some } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_WHITESPACE } from '../../define.js';
import { AttributeSpot } from '../spot/attribute.js';
import { EventSpot } from '../spot/event.js';
import { InputSpot } from '../spot/input.js';
import { ModifierSpot } from '../spot/modifier.js';
import { $str, $var } from '../utils/index.js';
import {
  hasSuffix,
  isClassAttribute,
  isCurlyBracesAttribute,
  isPrefixBind,
  isPrefixLine,
  isStringAttribute,
} from '../utils/node.js';
import { findDependencies, functionExpressionAnalysis, javaScriptToAST } from '../utils/script.js';
import { updateStyleAttribute } from '../utils/style.js';

export default {
  /**
   * Compiles an attribute node, updating styles and generating the appropriate attribute string.
   */
  Attribute({ parent, node, component, figure, compile }) {
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
              content += updateStyleAttribute(value.content, component.changedStyles);
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

      if (hasSuffix(node)) {
        figure.addSpot(new ModifierSpot(parent, node));
      } else {
        figure.addSpot(new AttributeSpot(parent, node));
      }
      return;
    }

    if (hasSuffix(node)) {
      const dependencies = findDependencies(javaScriptToAST(node.value), node.value);
      component.addDependencies(dependencies, node.value);
      figure.addSpot(new ModifierSpot(parent, node, dependencies));
      return;
    }

    const hasValue = !isUndefined(value);
    figure.appendBlock(name);
    if (hasValue) {
      if (isClassAttribute(node)) {
        figure.appendBlock('=' + $str(updateStyleAttribute(value, component.changedStyles)));
      } else {
        figure.appendBlock('=' + $str(value));
      }
    }
    figure.appendBlock(RAW_WHITESPACE);
  },

  /**
   * Compiles a curly braces attribute node, adding dependencies to the component.
   */
  CurlyBracesAttribute({ node, component }) {
    component.addDependencies(node.dependencies, node.content);
  },

  /**
   * Compiles an event attribute node, handling modifiers and event handlers.
   */
  EventAttribute({ parent, node, component, figure }) {
    let { name, value } = node;
    let handler = value;
    let modifier = [];
    let dependencies = [];
    const isSuffix = hasSuffix(node);

    if (isArray(value)) {
      handler = value[0].content;

      if (handler == name && isSuffix) {
        const bind = filter(item => isPrefixBind(item), node.suffix);
        if (!isEmpty(bind)) handler = bind[0].name;
        node.value[0].expression = javaScriptToAST(handler).body[0].expression;
      }

      dependencies = value[0].dependencies;
    } else {
      node.expression = javaScriptToAST(handler).body[0].expression;
      dependencies = findDependencies(node.expression, handler);
    }

    if (isSuffix) {
      modifier = pipe(
        node.suffix,
        filter(item => isPrefixLine(item)),
        map(item => item.name)
      );
    }

    const expression = node.expression || node.value[0].expression;
    const own = functionExpressionAnalysis(expression);
    const diffDependencies = diff(own.arguments, dependencies);
    component.addUpdatedDependencies(diffDependencies);
    figure.addSpot(new EventSpot(parent, node, modifier, handler, expression, own));
  },
  /**
   * Processes a bind attribute node.
   */
  BindAttribute({ parent, node, component, figure }) {
    component.addUpdatedDependencies(node.value[0].content.trim());
    figure.addSpot(new InputSpot(parent, node));
  },
};
