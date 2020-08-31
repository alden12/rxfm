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
  h2('Motivation'),
  p(
    `RxJS opens up a lot of cool new ways to write code which can be really useful in user interfaces.`,
    ` I created this framework to extend these into creating web pages directly,`,
    ` essentially to cut out the middle man.`,
  ),
  p(
    `Reactive code lets us express how we want our application to look and react to events,`,
    ` without having to worry about when changes will happen.`,
    ` What this means is that we can write code with another dimension,`,
    ` which takes into account the time-changing nature of our application.`,
  ),
  p(
    `Modern user interfaces are designed to respond to their users and to change dynamically.`,
    ` So it makes sense to write the code for them in a way that allows for this change and flow.`,
    ` RxFM is built on these data-flow principles, taking the web page along for the ride and`,
    ` spitting out a fully formed document at the end!`,
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
  p(
    `RxFM is fully typed and works best with `,
    a({ href: 'https://www.typescriptlang.org/' }, 'TypeScript'),
    '.',
  ),
  h2('Useful Links'),
  ul(
    li(a({ href: 'https://github.com/alden12/rxfm' }, 'RxFM GitHub Page')),
    li(a({ href: 'https://www.npmjs.com/package/rxfm' }, 'RxFM on npm')),
    li(a({ href: 'https://www.learnrxjs.io/' }, 'Learn RxJS')),
  ),
);
