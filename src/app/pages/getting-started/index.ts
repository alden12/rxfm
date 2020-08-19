import { div, a, p, h2, ul, li } from 'rxfm'
import { codeBlock } from '../../layout/code-block';

export const gettingStarted = div(
  p(
    'Welcome to RxFM, a web framework based on the ',
    a({ href: 'https://github.com/ReactiveX/rxjs' }, 'RxJS'),
    ' reactive library! ',
    'RxFM lets you express your apps using inherently reactive building blocks. ',
    `These reactive elements or 'Observables' can emit whatever and whenever they like, `,
    'so your webpage can show whatever and whenever it wants!',
  ),
  h2('Installation'),
  p(
    'To install RxFM in an existing project with npm simply use:',
    codeBlock('npm install rxfm', true),
  ),
  p(
    'Or to get started from scratch, you can download, clone, or fork the ',
    a({ href: 'https://github.com/alden12/rxfm-starter-app' }, 'RxFM Starter App.'),
    ' as long as you have ',
    a({ href: 'https://nodejs.org' }, 'NodeJS'),
    ' installed.',
  ),
  p('Then run:', codeBlock('npm install', true)),
  p('then', codeBlock('npm start', true)),
  p(
    'Once the app has started navigate to: ',
    a({ href: 'http://localhost:3000/' }, 'localhost:3000/'),
    ' in your browser to view the app.',
  ),
  h2('Useful Links'),
  ul(
    li(a({ href: 'https://github.com/alden12/rxfm' }, 'RxFM Github Page')),
    li(a({ href: 'https://www.npmjs.com/package/rxfm' }, 'RxFM on npm')),
    li(a({ href: 'https://www.learnrxjs.io/' }, 'Learn RxJS')),
  ),
);
