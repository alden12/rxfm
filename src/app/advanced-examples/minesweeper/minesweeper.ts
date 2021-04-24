import { destructure, Div, event, flatten, mapToComponents, styles, using } from 'rxfm';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

// Types:

type MinesweeperCellType = 'cleared' | 'undiscovered' | 'marked' | 'mine' | 'exploded';
type MinesweeperCell = { type: MinesweeperCellType, neighbors: number | null };
type MinesweeperBoard = MinesweeperCell[][];
type Vector = [number, number]; // [x, y]

// Constants:

const BOARD_WIDTH = 14;
const BOARD_HEIGHT = 7;

const CELL_COLOR_MAP: Record<MinesweeperCellType, string> = {
  cleared: 'grey',
  undiscovered: 'lightgrey',
  marked: 'teal',
  mine: 'black',
  exploded: 'red'
};

// Game Logic:

const getBoard = (): MinesweeperBoard => {
  const board: MinesweeperCell[][] = Array(BOARD_WIDTH)
    .fill(undefined)
    .map(() => Array(BOARD_HEIGHT).fill({ type: 'undiscovered', neighbors: null }));
  return board;
};

// Display Logic:

const MinesweeperCell = (
  cell: Observable<MinesweeperCell>,
  index: Observable<number>,
  discoverCell: (index: number) => void,
) => {
  const { type, neighbors } = destructure(cell);

  return Div(neighbors).pipe(
    styles({
      height: '20px',
      width: '20px',
      backgroundColor: using(type, type => CELL_COLOR_MAP[type]),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    }),
    event('click', using(index, index => () => discoverCell(index))),
  );
};

export const GameBoard = (board: Observable<MinesweeperBoard>, discoverCell: (index: number) => void) => Div(
  board.pipe(
    map(flatten),
    mapToComponents((_, i) => i, (cell, i) => MinesweeperCell(cell, i, discoverCell)),
  ),
).pipe(
  styles({
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'max-content',
    gridTemplateRows: `repeat(${BOARD_HEIGHT}, max-content)`,
    gridGap: '2px',
  }),
);

export const Minesweeper = () => {
  const discover = new Subject<Vector>();
  const discoverCell = (index: number) => discover.next([Math.floor(index / BOARD_HEIGHT), index % BOARD_HEIGHT]);

  return Div(
    GameBoard(
      of(getBoard()),
      discoverCell,
    ),
  );
}
