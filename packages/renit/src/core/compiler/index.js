import { isNil } from '../../libraries/is/index.js';
import { htmlToAst } from '../../libraries/to/index.js';

export function compiler(code) {
  if (isNil(code)) return;

  const ast = htmlToAst(code, {
    attribute: { affix: true },
    transform: { whitespace: false, trim: true },
  });

  return ast;
}
