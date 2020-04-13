import { div, addToBody, children } from 'rxfm';

export const app = () => div().pipe(
  children('tets')
);

addToBody(app);
