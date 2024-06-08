import { isUndefined } from '../../../libraries/is/index.js';
import { addComputed, reactiveWatch } from './reactive.js';
import { mount } from './utils.js';

export function component(init, props) {
  const self = {
    $_c: [],
    $_w: [],
    $p: !isUndefined(props) ? props : {},
    $c(computed, ...trackers) {
      addComputed(self.$_c, computed, trackers);
    },
    $w(value) {
      reactiveWatch(self.$_w, self.$_c);
      return value;
    },
  };

  init = init.call(self);
  return target => {
    mount(target, init);
  };
}
