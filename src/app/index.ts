import { addToBody, div, link, addToHead } from 'rxfm';
import { layout } from './layout';
import { store } from './store';

import './styles.css';

addToHead(
  link({ href: 'https://fonts.googleapis.com/icon?family=Material+Icons', rel: 'stylesheet' }),
);

addToHead(
  link({ href: 'https://fonts.googleapis.com/css2?family=Exo:wght@500&display=swap', rel: 'stylesheet' }),
);

addToBody(
  div(
    { id: 'app' },
    store.connect(layout),
  )
);
