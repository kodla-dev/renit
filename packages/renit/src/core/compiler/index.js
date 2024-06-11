import { isNil } from '../../libraries/is/index.js';
import { transform } from './transform/index.js';

export function compiler(code) {
  if (isNil(code)) return;
  let ast = transform(code);
  return ast;
}
