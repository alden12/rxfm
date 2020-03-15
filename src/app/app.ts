import { app } from './todo';

export function main() {
  app().subscribe(({ node }) => document.body.appendChild(node));
}

main();
