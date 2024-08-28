import { isArray, isNull, isNumber } from '../../../libraries/is/index.js';
import { safeMulti } from '../common.js';
import { share, unMount } from '../share.js';
import { addCD, newCD, removeCD, watch, watchArray } from './reactive.js';
import { append, eachNodes, location, removeRange } from './utils.js';

/** @type {Object} Temporary blocks */
let blocks = {};

/**
 * Extracts the block content from the provided HTML.
 *
 * @param {string} html The HTML string representing the block.
 * @returns {DocumentFragment|Node} The content of the block.
 */
export function block(html) {
  let block = blocks[html];
  if (!block) {
    let element = document.createElement('template');
    element.innerHTML = html;
    let content = element.content;
    if (content.childNodes.length == 1) content = content.firstChild;
    block = blocks[html] = content;
  }
  return block.cloneNode(true);
}

/**
 * Creates a function that generates a block element from HTML content and applies
 * a processing function to it.
 *
 * @param {string} html The HTML content used to create the block element.
 * @param {Function} [process] A function that processes the block element.
 * @returns {Function} A function that generates a block element.
 */
export function makeBlock(html, process) {
  const content = block(html);
  return (...prop) => {
    const block = content.cloneNode(true);
    return [block, process?.(block, ...prop)];
  };
}

/**
 * Adds a style element with the specified id and content to the document head.
 *
 * @param {string} id - The id to set on the style element.
 * @param {string} content - The CSS content to include in the style element.
 */
export function style(id, content) {
  if (document.head.querySelector('style#' + id)) return;
  let style = document.createElement('style');
  style.id = id;
  style.innerHTML = content;
  document.head.appendChild(style);
}

/**
 * Handles rendering and managing conditional blocks based on conditions.
 *
 * @param {HTMLElement} container - The container element to append blocks to.
 * @param {Array} conditions - Array of conditions to watch.
 * @param {Array<Function>} parts - Array of builder functions for each condition.
 */
export function ifBlock(container, conditions, parts) {
  // Variables to track block boundaries, ChangeDetector, and cleanup functions
  let start, end, $cd, $unmount, $parentCD = share.cd; // prettier-ignore
  unMount(() => safeMulti($unmount, share.destroy));

  /**
   * Creates and renders a block based on the builder function.
   * @param {Function} builder - Builder function returning the block to render.
   */
  function create(builder) {
    let block;
    $unmount = share.unmount = [];
    let $mount = (share.mount = []);
    $cd = share.cd = newCD($parentCD);
    try {
      [block] = builder();
    } finally {
      share.unmount = share.mount = share.cd = null;
    }
    addCD($parentCD, $cd);
    [start, end] = location(block);
    append(container, block);
    safeMulti($mount, $unmount, 1);
  }

  /**
   * Destroys the current block if it exists.
   */
  function destroy() {
    if (!start) return;
    share.destroy = [];
    safeMulti($unmount, share.destroy);
    $unmount.length = 0;
    if ($cd) {
      removeCD($cd);
      $cd = null;
    }
    if (share.destroy.length) {
      let s = start, e = end; // prettier-ignore
      Promise.allSettled(share.destroy).then(() => {
        removeRange(s, e);
      });
    } else {
      removeRange(start, end);
    }
    start = end = null;
    share.destroy = null;
  }

  // Watch for changes in conditions array
  watch(conditions, condition => {
    destroy(); // Destroy current block
    if (!isNull(condition)) create(parts[condition]); // Create new block based on condition
  });
}

/**
 * Handles rendering and managing lists and their associated blocks in a container.
 *
 * @param {HTMLElement} container - The container element to append blocks to.
 * @param {Array} lists - The list or array to iterate over.
 * @param {Function} forKey - Function to generate keys for list items.
 * @param {Function} part - Function returning a tuple with the block and cleanup function for each item.
 * @param {Function} [elsePart] - Optional function for rendering an else block when the list is empty.
 */
export function forBlock(container, lists, forKey, part, elsePart) {
  // Parent ChangeDetector for the block
  let parentCD = share.cd;

  // Create a new ChangeDetector for this block
  let forCD = newCD();
  addCD(parentCD, forCD);

  // Map to store contexts of rendered blocks
  let map = new Map();

  // Reference to the first rendered block
  let first;

  // Counter to track iterations
  let counter = 0;

  // Flags for managing cleanup and promises
  let parentPromise = 0;
  let parentUnMount = 0;
  let elseBlock;

  // Function to clean up all blocks
  const unMountAll = () => {
    parentUnMount && map.forEach(ctx => safeMulti(ctx.u, share.destroy));
    map.clear();
  };

  // Set up unmount handlers for cleanup
  unMount(unMountAll);
  elsePart && unMount(() => elseBlock?.());

  // Watch the lists for changes
  watch(
    lists,
    list => {
      // Normalize list input
      if (!list) list = [];
      if (isNumber(list)) list = [...Array(list)].map((_, i) => i);
      else if (!isArray(list)) list = [];

      // Temporary map to track new contexts
      let temp = new Map();

      // Parent element of the container
      const parent = container.parentNode;

      // If there are existing rendered blocks
      if (map.size) {
        let ctx;
        let count = 0;
        counter++;

        // Check each item in the list against existing contexts
        for (let i = 0, n = list.length; i < n; ++i) {
          ctx = map.get(forKey(list[i], i, list));
          if (ctx) {
            ctx.a = counter; // Mark context as current iteration
            count++;
          }
        }

        // If no matching items found and there are existing blocks
        if (!count && first) {
          share.destroy = [];
          forCD.children.length = 0;
          unMountAll();

          // Remove blocks from DOM
          if (share.destroy.length) {
            parentPromise = 1;
            let removed = [];
            eachNodes(first, container.previousSibling, n => {
              n.$$removing = true;
              removed.push(n);
            });
            Promise.allSettled(share.destroy).then(() => removed.forEach(n => n.remove()));
          } else {
            removeRange(first, container.previousSibling);
          }
          share.destroy = null;
        }
        // If fewer items than existing blocks, remove excess blocks
        else if (count < map.size) {
          forCD.children = [];
          share.destroy = [];
          let removed = [];
          map.forEach(ctx => {
            if (ctx.a == counter) {
              ctx.cd && forCD.children.push(ctx.cd);
              return;
            }
            safeMulti(ctx.u, share.destroy);
            eachNodes(ctx.s, ctx.e, n => removed.push(n));
          });

          // Remove excess blocks from DOM
          if (share.destroy.length) {
            parentPromise = 1;
            removed.forEach(n => (n.$$removing = true));
            Promise.allSettled(share.destroy).then(() => removed.forEach(n => n.remove()));
          } else {
            removed.forEach(n => n.remove());
          }
          share.destroy = null;
        }
      }

      // Render new blocks based on the updated list
      if (elseBlock && list.length) {
        elseBlock();
        elseBlock = null;
      }

      let i = list.length;
      let next = container;
      let ctx;
      let nextCtx;
      let nextEl;
      let key;

      // Iterate through the list to render or update blocks
      while (i--) {
        const item = list[i];
        key = forKey(item, i, list);

        if (nextCtx) {
          ctx = nextCtx;
          nextCtx = null;
        } else ctx = map.get(key);

        // If block context exists, update its position and data
        if (ctx) {
          nextEl = next ? next.previousSibling : parent.lastChild;
          if (parentPromise) while (nextEl && nextEl.$$removing) nextEl = nextEl.previousSibling;
          if (nextEl != ctx.e) {
            let insert = true;
            if (ctx.s == ctx.e && i > 0 && nextEl) {
              nextCtx = map.get(forKey(list[i - 1], i - 1, list));
              if (nextCtx && nextEl.previousSibling === nextCtx.e) {
                parent.replaceChild(ctx.s, nextEl);
                insert = false;
              }
            }

            // Insert block into DOM at the correct position
            if (insert) {
              let nxt, el = ctx.s; // prettier-ignore
              while (el) {
                nxt = el.nextSibling;
                parent.insertBefore(el, next);
                if (el == ctx.e) break;
                el = nxt;
              }
            }
          }

          // Execute callback for block behavior
          ctx.b?.(item, i);
          next = ctx.s; // Update next insertion point
        } else {
          let block;
          let b;
          let u = (share.unmount = []);
          let m = (share.mount = []);
          let cd = (share.cd = newCD(forCD));

          try {
            [block, b] = part(item, i);
          } finally {
            share.unmount = share.mount = share.cd = null;
          }

          // Create context for the new block
          ctx = { cd, b };

          // Add ChangeDetector to parent
          addCD(forCD, cd);

          // Determine start and end of the block in the DOM
          [ctx.s, ctx.e] = location(block);

          // Insert block into DOM
          parent.insertBefore(block, next);

          // Update next insertion point
          next = ctx.s;

          // Execute mount functions safely
          safeMulti(m, u, 1);

          // If there are unmount functions, mark for parent cleanup
          if (u.length) {
            ctx.u = u;
            parentUnMount = 1;
          }
        }

        // Store context in temporary map
        temp.set(key, ctx);
      }

      // Update reference to first rendered block
      first = next;

      // Update map to new contexts
      map.clear();
      map = temp;

      // Render else block if list is empty and elsePart exists
      if (!list.length && !elseBlock && elsePart) {
        elseBlock = forElseBlock(elsePart)(container, parentCD);
      }
    },
    {
      ch: watchArray, // Use watchArray for efficient array comparison
    }
  );
}

/**
 * Creates a function that renders an else block into a container using a parent ChangeDetector.
 *
 * @param {Function} part - Function returning the else block's DOM structure.
 * @returns {Function} - A function that renders the else block and returns a cleanup function.
 */
function forElseBlock(part) {
  return (container, parentCD) => {
    let start, end;
    let unmount = (share.unmount = []);
    let cd = (share.cd = newCD(parentCD));
    share.mount = [];
    const parent = container.parentNode;
    let block;
    try {
      [block] = part();
      [start, end] = location(block);

      // Add child ChangeDetector to parent
      addCD(parentCD, cd);

      // Insert block into DOM
      parent.insertBefore(block, container);

      // Execute mount functions safely
      safeMulti(share.mount, unmount, 1);
    } finally {
      // Clean up after rendering
      share.unmount = share.mount = share.cd = null;
    }

    // Return cleanup function
    return () => {
      // Remove child ChangeDetector from parent
      removeCD(cd);

      // Prepare for destruction
      share.destroy = [];
      safeMulti(unmount, share.destroy);
      if (share.destroy.length) {
        const s = start, e = end; // prettier-ignore
        eachNodes(s, e, n => (n.$$removing = true));
        Promise.allSettled(share.destroy).then(() => eachNodes(s, e, n => n.remove()));
      } else {
        // Remove DOM nodes
        removeRange(start, end);
      }
      share.destroy = null;
    };
  };
}
