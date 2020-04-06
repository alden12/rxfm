import { app } from './todo';
import { addToBody } from '../rxfm';

export function main() {
  addToBody(app);
}

main();
