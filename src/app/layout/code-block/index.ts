import { HTML } from 'rxfm';

import './code-block.css';

export const codeBlock = (code: string) => HTML.pre(
  { class: 'code-block' },
  HTML.code(code)
)
