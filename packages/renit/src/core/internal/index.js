import { each } from '../../libraries/collect/index.js';
import { isElement, isNull, isText } from '../../libraries/is/index.js';
import { size } from '../../libraries/math/index.js';
import {
  effect,
  state,
  stateArray,
  stateObject,
  store,
  watch,
} from '../../libraries/store/index.js';
import { RAW_TEMPLATE } from '../define.js';
import {
  appendChild,
  childNodes,
  cloneNode,
  createAnchor,
  createTreeWalker,
  currentNode,
  firstChild,
  innerElement,
  insertBefore,
  lastChild,
  nextNode,
  nextSibling,
  parentNode,
  previousSibling,
  remove,
  replaceChild,
  replaceWith,
} from './dom.js';
import { eachKey, eachNodes, location, removeRange } from './utils.js';

export function component(init) {
  return target => {
    const $ = {};
    init = init.call($);
    mount(target, init);
  };
}

/**
 * Extracts the block content from the provided HTML.
 * @param {string} html The HTML string representing the block.
 * @returns {DocumentFragment|Node} The content of the block.
 */
export function block(html) {
  let template = innerElement(RAW_TEMPLATE, html);
  let content = template.content;
  if (size(childNodes(content)) == 1) {
    content = firstChild(content);
  }
  return content;
}

/**
 * Creates a function that generates a block element from HTML content and applies a processing function to it.
 * @param {string} html The HTML content used to create the block element.
 * @param {Function} [process] A function that processes the block element.
 * @returns {Function} A function that generates a block element.
 */
export function makeBlock(html, process) {
  const content = block(html);
  return (...prop) => {
    const block = cloneNode(content);
    return [block, process?.(block, ...prop)];
  };
}

/**
 * Conditionally mounts a block element based on the provided conditions and parts.
 * @param {Node} container The container node to mount the block element to.
 * @param {Function} conditions A function returning the condition for mounting the block element.
 * @param {Array} parts An array mapping conditions to functions that generate block elements.
 */
export function ifBlock(container, conditions, parts) {
  let mounted = false, start, end; // prettier-ignore
  effect(() => {
    if (mounted) {
      removeRange(start, end);
      mounted = false;
    }

    const condition = conditions();
    const part = parts[condition];

    if (part) {
      const [block] = part();
      [start, end] = location(block);
      mount(container, block);
      mounted = true;
    }
  });
}

/**
 * Iterates over a list and renders a block for each item in the list, managing updates efficiently.
 * @param {HTMLElement} container - The container element to append the blocks to.
 * @param {Function} lists - A function returning the list to iterate over.
 * @param {Function} part - A function returning a block and a bind function for each item in the list.
 */
export function eachBlock(container, lists, part) {
  const mode = isElement(container);
  let map = new Map();
  let first;
  let counter = 0;
  const child = mode == 1;
  effect(() => {
    const array = lists();
    let i = size(array);
    const parent = mode ? container : parentNode(container);
    let next = mode ? null : container;
    let ctx;
    let nextCtx;
    let nextEl;
    let temp = new Map();

    if (size(map)) {
      let ctx;
      let count = 0;
      counter++;
      each((item, i) => {
        ctx = map.get(eachKey(item, i, array));
        if (ctx) {
          ctx.a = counter;
          count++;
        }
      }, array);
      if (!count && first) {
        map.clear();
        if (child) text(container, '');
        else removeRange(first, previousSibling(container));
      } else if (count < size(map)) {
        let removed = [];
        map.forEach(ctx => {
          if (ctx.a == counter) return;
          eachNodes(ctx.s, ctx.e, n => removed.push(n));
        });
        each(n => remove(n), removed);
      }
    }

    while (i--) {
      const item = array[i];
      let key = eachKey(item, i, array);
      if (nextCtx) {
        ctx = nextCtx;
        nextCtx = null;
      } else ctx = map.get(key);
      if (ctx) {
        nextEl = next ? previousSibling(next) : lastChild(parent);
        if (nextEl != ctx.e) {
          let insert = true;
          if (ctx.s == ctx.e && i > 0 && nextEl) {
            nextCtx = map.get(eachKey(array[i - 1], i - 1, array));
            if (nextCtx && previousSibling(nextEl) === nextCtx.e) {
              replaceChild(parent, ctx.s, nextEl);
              insert = false;
            }
          }
          if (insert) {
            let nxt, el = ctx.s; // prettier-ignore
            while (el) {
              nxt = nextSibling(el);
              insertBefore(parent, el, next);
              if (el == ctx.e) break;
              el = nxt;
            }
          }
        }
        ctx.b?.(item, i);
        next = ctx.s;
      } else {
        const [block, b] = part(store(item), state(i));
        ctx = { b };
        [ctx.s, ctx.e] = location(block);
        insertBefore(parent, block, next);
        next = ctx.s;
      }
      temp.set(key, ctx);
    }
    first = next;
    map.clear();
    map = temp;
  });
}

/**
 * Replaces text nodes and elements in the HTML with anchor nodes and returns a list of references.
 * @param {HTMLElement} html The HTML element to process.
 * @returns {Array} An array of anchor nodes representing the references.
 */
export function reference(html) {
  // Create a tree walker to traverse the HTML.
  const walker = createTreeWalker(html, 128);

  // Initialize arrays to store nodes to replace and references.
  const replaces = [];
  const references = [];

  // Traverse the tree walker.
  while (nextNode(walker)) {
    const node = currentNode(walker);
    const next = nextSibling(node);
    const previous = previousSibling(node);

    // If the next and previous siblings are text nodes or null, replace the current node with an anchor.
    if ((isNull(next) || isText(next)) && (isNull(previous) || isText(previous))) {
      replaces.push([node, createAnchor()]);
    }

    // If the next sibling is an element, replace the current node with the next sibling.
    else if (isElement(next)) {
      replaces.push([node, next]);
    }
  }

  // Replace nodes and build the list of references.
  each(e => {
    const el = e[0];
    const target = e[1];

    if (isText(target)) {
      replaceWith(el, target);
    } else if (isElement(target)) {
      remove(el);
    }

    references.push(target);
  }, replaces);

  return references;
}

/**
 * Mounts a view into a container element, either by appending it as a child or inserting it before a specific node.
 * @param {HTMLElement|Text} container The container element or text node.
 * @param {HTMLElement} view The view element to mount.
 */
export function mount(container, view) {
  if (!view) return;
  if (isText(container)) {
    insertBefore(parentNode(container), view, container);
  } else {
    appendChild(container, view);
  }
}

/**
 * Represents the 'click' event.
 * @type {string}
 */
export const _click = 'click';

/**
 * Represents the 'value' property.
 * @type {string}
 */
export const _value = 'value';

/**
 * Represents the 'input' event.
 * @type {string}
 */
export const _input = 'input';

/**
 * Represents the 'checked' property name.
 * @type {string}
 */
export const _checked = 'checked';

/**
 * Name of the text content property.
 * @type {string}
 */
export const _textContent = 'textContent';

/**
 * Sets the attribute of an element.
 * If the attribute is a property of the element, it sets the property directly,
 * otherwise, it sets the attribute using setAttribute method.
 * @param {HTMLElement} element The element to set the attribute on.
 * @param {string} name The name of the attribute.
 * @param {string} value The value of the attribute.
 */
export function attribute(element, name, value) {
  if (name in element) {
    element[name] = value;
  } else {
    element.setAttribute(name, value);
  }
}

/**
 * Binds an attribute of an element to a reactive value.
 * @param {HTMLElement} element The element to bind the attribute to.
 * @param {string} name The name of the attribute.
 * @param {function} value A function returning the value to bind.
 */
export function bindAttribute(element, name, value) {
  effect(() => {
    attribute(element, name, value());
  });
}

/**
 * Adds an event listener to the specified element.
 * @param {HTMLElement} element - The HTML element to attach the event listener to.
 * @param {string} event - The name of the event.
 * @param {function} callback - The callback function to be executed when the event occurs.
 */
export function event(element, event, callback) {
  if (!callback) return;
  element.addEventListener(event, callback);
}

/**
 * Sets the text content of the specified node.
 * @param {Node} node The node to set the text content for.
 * @param {string} text The text content to set.
 */
export function text(node, text) {
  attribute(node, _textContent, text);
}

/**
 * Binds text content of a node to a reactive function.
 * @param {Node} node - The node whose text content will be bound.
 * @param {function} fn - The reactive function providing the text content.
 */
export function bindText(node, fn) {
  effect(() => {
    text(node, fn());
  });
}

/**
 * Binds text content of a node to a reactive function.
 * @param {Node} node - The node whose text content will be bound.
 * @param {function} fn - The reactive function providing the text content.
 */
export function bindTextWatch(node, fn) {
  const run = () => text(node, fn());
  run();
  watch(
    () => fn(),
    () => run()
  );
}

/**
 * Binds an input element's value to a reactive property.
 * @param {HTMLInputElement} element - The input element to bind.
 * @param {string} name - The name of the property to bind (e.g., 'value').
 * @param {function} get - The reactive getter function.
 * @param {function} set - The reactive setter function.
 */
export function bindInput(element, name, get, set) {
  bindAttribute(element, name, get);
  event(element, _input, () => {
    set(element[name]);
  });
}

export { state, stateArray, stateObject };
