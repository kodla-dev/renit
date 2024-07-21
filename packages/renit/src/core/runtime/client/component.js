import { share } from './share.js';
import { append, safe } from './utils.js';

export let current, context;

export function component(init) {
  return (options = {}, needMount = true) => {
    context = options.context || {};
    let prev = current;
    let prevCD = share.cd;
    let component = (current = { options });
    share.cd = null;

    try {
      component.dom = init(options);
    } finally {
      current = prev;
      share.cd = prevCD;
      context = null;
    }

    const r = { component };

    if (needMount) {
      r.mount = target => {
        target.appendChild(component.dom);
      };
    }

    return r;
  };
}

export function call(node, component, context, option = {}) {
  option.context = { ...context };
  let c = safe(() => component(option, 0));
  append(node, c.component.dom);
}
