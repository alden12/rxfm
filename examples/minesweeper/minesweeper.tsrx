// Minesweeper's view, in tsrx. The reactive engine lives in ./game and the pure
// rules in game-logic.ts; this file renders the engine's streams.
//
// The board is `board.flat().map(({ … }, index) => …)`: `.flat()` lifts to a stream
// of cells and `.map` to keyed components. The cell item is destructured in place —
// each field (`color`, `symbol`, …) is a stream of that field, so the style values,
// the class flag and the child text all lift; fields of one cell share the item, so a
// multi-field expression collapses to a single map. The click/flag handlers capture
// `index` (also a stream) — tsrx lifts a handler that reads a stream into a stream of
// handlers, so `indexToVector(index)` sees the current value.
import { Div, Button } from 'rxfm';
import { board, gameStage, gameTime, highScore, dispatch } from './game';
import { NEIGHBORS_COLOR_MAP, BOARD_HEIGHT, indexToVector } from './constants';

import './minesweeper-styles.css';

export const Minesweeper = () => {
  const cells = board.flat().map(({ color, neighbors, symbol, isUndiscovered, isCleared, hasNeighbors }, index) =>
    Div
      .style({
        backgroundColor: color,
        color: NEIGHBORS_COLOR_MAP[neighbors],
        fontSize: symbol ? '12px' : '14px',
      })
      .class('minesweeper-cell', isUndiscovered ? 'raised' : '')
      .onClick(() => dispatch({ type: 'discover', cell: indexToVector(index) }))
      .onContextmenu(() => dispatch({ type: 'flag', cell: indexToVector(index) }))(
        // The neighbouring-mine count once cleared, otherwise the cell's symbol.
        isCleared && hasNeighbors ? neighbors : symbol,
      ),
  );

  const gameBoard = Div
    .class('minesweeper-board')
    .style({ gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)` })
    .onContextmenu(event => event.preventDefault())(
      cells
    );

  // These show only when they have something to say. As a *child*, the empty branch
  // is `null` (not EMPTY): `null` tells rxfm to clear the element, whereas EMPTY
  // emits nothing and would leave the previous element on screen — so e.g. the win
  // message would linger after a restart.
  const controls = Div
    .class('minesweeper-controls')(
      Button
        .onClick(() => dispatch({ type: 'start', cell: [0, 0] }))
        `Restart`,
      Div`Time: ${gameTime}s`,
      highScore ? Div`Best: ${highScore}s` : null,
      gameStage === 'win' ? Div`You Win!`
        : gameStage === 'gameOver' ? Div`Game Over!`
        : null,
    );

  return Div
    .class('minesweeper')(
      gameBoard,
      controls,
    );
};
