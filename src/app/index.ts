import { addToBody, div } from 'rxfm';
import { layout } from './layout';

import './styles.css';

addToBody(
  div(
    { id: 'app' },
    layout,
  )
);
