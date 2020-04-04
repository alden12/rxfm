import { app } from './todo';
import { addToBody } from '../rxfm/components';

export function main() {
  addToBody(app);
}

main();
