import { pipe } from '../../../helpers/index.js';
import {
  diff,
  each,
  filter,
  includes,
  map,
  push,
  some,
  split,
} from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { RAW_WHITESPACE } from '../../define.js';
import { AttributeSpot } from '../spot/attribute.js';
import { EventSpot } from '../spot/event.js';
import { InputSpot } from '../spot/input.js';
import { ModifierSpot, ModifiersSpot } from '../spot/modifier.js';
import { StaticSpot } from '../spot/static.js';
import { $escape, $str, $var } from '../utils/index.js';
import {
  hasSuffix,
  isAttribute,
  isClassAttribute,
  isClassOrIdAttribute,
  isCurlyBracesAttribute,
  isModifierAttribute,
  isPrefixAttribute,
  isPrefixBind,
  isPrefixLine,
  isSSR,
  isStringAttribute,
} from '../utils/node.js';
import { findDependencies, functionExpressionAnalysis, javaScriptToAST } from '../utils/script.js';
import { updateStyleAttribute } from '../utils/style.js';

export default {
  /**
   * Compiles an attribute node, updating styles and generating the appropriate attribute string.
   */
  Attribute({ parent, node, component, figure, compile, options }) {
    const ssr = isSSR(options);
    let { name, value } = node;

    if (isArray(value)) {
      // Check if all values are literals
      const onlyLiterals = !some(
        val => isCurlyBracesAttribute(val) && val.literals == false,
        node.value
      );

      // Check if all values are static
      const onlyStatic = !some(
        val => isCurlyBracesAttribute(val) && val.static == false,
        node.value
      );

      if (onlyLiterals) {
        let content = '';
        each(value => {
          if (isStringAttribute(value)) {
            if (isClassOrIdAttribute(node)) {
              let type = 'id';
              if (isClassAttribute(node)) type = 'class';
              // Update style name if the attribute is a class attribute
              content += updateStyleAttribute(
                value.content,
                type,
                component.changedStyles,
                options.component
              );
            } else {
              content += value.content;
            }
          } else if (isCurlyBracesAttribute(value)) {
            if (ssr) {
              content += $var($escape(value.content.trim()));
            } else {
              content += $var(value.content.trim());
            }
          }
        }, value);
        figure.appendBlock(name + '=');
        figure.appendBlock($str(content));
        figure.appendBlock(RAW_WHITESPACE);
        return;
      }

      if (onlyStatic) {
        if (ssr) figure.startBlock();
        figure.addSpot(new StaticSpot(parent, node, ssr));
        if (ssr) figure.endBlock();
        return;
      }

      // Compile child nodes and add a new attribute spot to the figure
      map(child => compile(child), node.value);

      if (ssr) figure.startBlock();
      figure.addSpot(new AttributeSpot(parent, node, ssr));
      if (ssr) figure.endBlock();
      return;
    }

    if (ssr) {
      const needSpot = some(
        attribute => !isPrefixAttribute(attribute) && isArray(attribute.value),
        parent.attributes
      );
      if (needSpot) {
        figure.startBlock();
        figure.addSpot(new AttributeSpot(parent, node, ssr));
        figure.endBlock();
        return;
      }
    }

    figure.appendBlock(name);

    const hasValue = !isUndefined(value);

    if (hasValue) {
      if (isClassOrIdAttribute(node)) {
        let type = 'id';
        if (isClassAttribute(node)) type = 'class';
        figure.appendBlock(
          '=' + $str(updateStyleAttribute(value, type, component.changedStyles, options.component))
        );
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
  EventAttribute({ parent, node, component, figure, options }) {
    const ssr = isSSR(options);
    if (ssr) return;

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
      node.root = some(suffix => suffix.name == 'root', node.suffix);
      component.rootEvent = true;
    }

    const expression = node.expression || node.value[0].expression;
    const own = functionExpressionAnalysis(expression);
    const diffDependencies = diff(own.arguments, dependencies);
    component.addUpdatedDependencies(diffDependencies);

    if (own.assignment) {
      const identifier = split('=', handler)[0].trim();
      component.addUpdatedDependencies(identifier);
    }

    figure.addSpot(new EventSpot(parent, node, modifier, handler, expression, own));
  },
  BindAttribute({ parent, node, component, figure, options }) {
    const ssr = isSSR(options);
    let value = node.value;
    if (isArray(node.value)) value = node.value[0].content;
    value = value.trim();
    component.addDependencies(value);
    component.addUpdatedDependencies(value);
    node.value = value;
    if (ssr) figure.startBlock();
    figure.addSpot(new InputSpot(parent, node, ssr));
    if (ssr) figure.endBlock();
  },
  ModifierAttribute({ parent, node, component, figure, options }) {
    let { value, name } = node;
    const ssr = isSSR(options);
    value = value[0];
    component.addDependencies(value.dependencies, value.content);
    if (ssr) {
      const checkAttribute = some(
        attribute => isAttribute(attribute) && attribute.name == node.name,
        parent.attributes
      );
      if (checkAttribute) {
        if (!parent.modifiers) parent.modifiers = [];
        const modifier = new ModifierSpot(parent, node);
        push(modifier, parent.modifiers);
      } else {
        if (!parent.checkModifiers) parent.checkModifiers = [];

        if (!includes(name, parent.checkModifiers)) {
          figure.startBlock();
          const modifiers = filter(
            attribute => isModifierAttribute(attribute) && attribute.name == node.name,
            parent.attributes
          );
          figure.addSpot(new ModifiersSpot(parent, modifiers));
          figure.endBlock();
        }

        push(name, parent.checkModifiers);
      }
    } else {
      figure.addSpot(new ModifierSpot(parent, node));
    }
  },
};
