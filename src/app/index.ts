import { app } from './todo';
import { addToBody, div } from 'rxfm';

import './styles.css';

addToBody(
  div(
    { id: 'app' },
    app,
  )
);
