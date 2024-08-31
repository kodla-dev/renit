/**
  Runtime
  ------------------------------------------------------------------------------
  Executes its functionality by processing code in real-time during runtime.
  ------------------------------------------------------------------------------
*/

export { Action, Attribute, Html, Input, Modifier, Modifiers, Text } from './client/bind.js';
export { block, forBlock, ifBlock, makeBlock, style } from './client/block.js';
export { call, component, dyn } from './client/component.js';
export { _checked, _class, _click, _style, _value } from './client/const.js';
export { mount } from './client/mount.js';
export { computed, update } from './client/reactive.js';
export { attribute, event, html, modifier, modifiers, rootEvent, text } from './client/static.js';
export { compare, forKey, noop, reference } from './client/utils.js';
export { ssrCall, ssrComponent } from './server/component.js';
export { ssrAttribute, ssrBindAttribute } from './server/static.js';
export { escape } from './server/utils.js';
export { context, current, onMount, tick, unMount } from './share.js';
