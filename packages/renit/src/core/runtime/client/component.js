import { isUndefined } from '../../../libraries/is/index.js';
import { digest, mount, tick } from './utils.js';

export function component(init, props) {
  const self = {
    // watch
    $w: [],
    // update
    $u(value) {
      tick(() => digest(self.$w));
      return value;
    },
    // props
    $p: !isUndefined(props) ? props : {},
    // apply
    $a: () => {},
  };
  init = init.call(self);
  self.$u();
  return target => {
    mount(target, init);
  };
}
