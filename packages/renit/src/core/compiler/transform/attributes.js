import { isEmpty } from '../../../libraries/is/index.js';
import { visit } from '../../../libraries/to/index.js';
import { containsCurlyBraces, getContentCurlyBraces, parseCurlyBraces } from '../utils/curly.js';
import { setNodeParam } from '../utils/index.js';

export function attributes(ast) {
  visit(ast, {
    Attribute: node => {
      let value = node.value;
      let hasParentReference = false;

      if (!isEmpty(value)) {
        if (containsCurlyBraces(value)) {
          const parsed = parseCurlyBraces(value, 'attribute');
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
        if (!containsCurlyBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseCurlyBraces(value, 'attribute');
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
        if (!containsCurlyBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseCurlyBraces(value, 'attribute');
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
        if (!containsCurlyBraces(value)) {
          value = `{${value}}`;
        }
        const parsed = parseCurlyBraces(value, 'attribute');
        node.value = parsed.values;
      }

      setParentReference(node);
    },
    RefAttribute: node => {
      setParentReference(node);
    },
    ActionAttribute: node => {
      if (containsCurlyBraces(node.value)) {
        node.value = getContentCurlyBraces(node.value);
      }
      setParentReference(node);
    },
  });
}

function setParentReference(node) {
  const parent = node.parent();
  setNodeParam(parent, 'reference', true);
}
