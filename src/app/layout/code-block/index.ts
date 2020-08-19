import { HTML } from 'rxfm';

import './code-block.css';

export const codeBlock = (code: string, standalone = false) => HTML.pre(
  { class: ['code-block', standalone && 'standalone'] },
  HTML.code(code)
)
