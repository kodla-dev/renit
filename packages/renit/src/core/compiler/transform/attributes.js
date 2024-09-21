import { isEmpty } from '../../../libraries/is/index.js';
import { visit } from '../../../libraries/to/index.js';
import { containsBraces, getContentBraces, parseBraces } from '../utils/braces.js';
import { hasBrackets, parseBrackets } from '../utils/brackets.js';
import { setNodeParam } from '../utils/index.js';

export function attributes(ast) {
  visit(ast, {
    Attribute: node => {
      let value = node.value;
      let hasParentReference = false;

      if (!isEmpty(value)) {
        if (hasBrackets(value)) {
          const parsed = parseBrackets(value);
          if (parsed.link) {
            node.type = 'LinkAttribute';
            node.value = parsed.value;
            node.literals = parsed.literals;
            if (!node.literals) hasParentReference = true;
          }
        } else if (containsBraces(value)) {
          const parsed = parseBraces(value, 'attribute');
          node.value = parsed.values;
          hasParentReference = parsed.reference;
        }
      }

      if (hasParentReference) setParentReference(node);
    },
    EventAttribute: node => {
      let value = node.value;

      // Handle empty values by setting them to a default value based on the node's name.
      if (isEmpty(value)) {
        node.value = value = `{${node.name}}`;
      }

      if (!isEmpty(value)) {
        if (!containsBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseBraces(value, 'attribute');
        node.value = parsed.values;
      }

      setParentReference(node);
    },
    ModifierAttribute: node => {
      let value = node.value;

      if (isEmpty(value)) {
        node.value = value = `{${node.name}}`;
      }

      if (!isEmpty(value)) {
        if (!containsBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseBraces(value, 'attribute');
        node.value = parsed.values;
      }

      setParentReference(node);
    },
    BindAttribute: node => {
      let value = node.value;

      if (isEmpty(value)) {
        node.value = value = `{${node.name}}`;
      }

      if (!isEmpty(value)) {
        if (!containsBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseBraces(value, 'attribute');
        node.value = parsed.values;
      }

      setParentReference(node);
    },
    RefAttribute: node => {
      setParentReference(node);
    },
    ActionAttribute: node => {
      if (containsBraces(node.value)) {
        node.value = getContentBraces(node.value);
      }
      setParentReference(node);
    },
  });
}

function setParentReference(node) {
  const parent = node.parent();
  setNodeParam(parent, 'reference', true);
}
