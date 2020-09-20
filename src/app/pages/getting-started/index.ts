import { div, a, p, h2, ul, li } from 'rxfm'
import { codeBlock } from '../../layout/code-block';

import './getting-started.css';

const welcome = `const welcome = div(
  h1('Welcome to RxFM!'),
  p('A web framework based on the RxJS reactive library!'),
);`;

export const gettingStarted = div(
  p(
    { class: 'intro' },
    `Welcome to RxFM, a web framework based on the `,
    a({ href: 'https://github.com/ReactiveX/rxjs' }, 'RxJS'),
    ` reactive library!
    RxFM lets you express your apps using inherently reactive building blocks.
    These reactive elements or 'observables' can emit whatever and whenever they like,
    so your webpage can show whatever and whenever it wants!`,
  ),
  codeBlock(welcome, true),
  h2('Motivation'),
  p(
    `The RxJS library opens up a lot of exciting new ways to write code which can be really useful in user interfaces.
    I created this framework to extend these into creating web pages directly,
    essentially to cut out the middle man.`,
  ),
  p(
    `Reactive code lets us express how we want our application to look and react to events,
    without having to worry about when changes will happen.
    What this means is that we can write code with another dimension,
    which takes into account the time-changing nature of our application.`,
  ),
  p(
    `Modern user interfaces are designed to respond to their users and to change dynamically.
    So it makes sense to write the code for them in a way that allows for this change and flow.
    RxFM is built on these data-flow principles, taking the web page along for the ride and
    giving you a fully formed document at the end!`,
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
  h2('Paradigms'),
  p(
    `RxFM is built around the paradigms of functional, reactive, and strongly-typed code.
    As a result you won't see too many classes when working with RxFM.
    Code is generally written to be immutable whenever possible,
    meaning that state is handled through replacing objects rather than modifying them.
    RxFM is strongly-typed and is best used with `,
    a({ href: 'https://www.typescriptlang.org/' }, 'TypeScript'),
    `.
    This helps to reduce errors and bugs by making sure that the building blocks
    are always used with the correct types and in the right places.
    Writing HTML directly has been foregone in RxFM in favor of the advantages given by
    writing our templates as code,
    however JSX/ TSX support could be added in a future release to bring back HTML-like syntax.`,
  ),
  h2('Useful Links'),
  ul(
    li(a({ href: 'https://github.com/alden12/rxfm' }, 'RxFM GitHub Page')),
    li(a({ href: 'https://www.npmjs.com/package/rxfm' }, 'RxFM on npm')),
    li(a({ href: 'https://www.learnrxjs.io/' }, 'Learn RxJS')),
  ),
);
