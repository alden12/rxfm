import RxFM, { FC } from "rxfm";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

import './platformer.css';

type Vector = [x: number, y: number];

interface BoundingBox {
  bottomLeft: Vector;
  topRight: Vector;
}

interface Platform {
  coords: Vector[];
}

const PIXEL_SIZE = 20;

const WIDTH = PIXEL_SIZE * 20;
const HEIGHT = PIXEL_SIZE * 7;

const Platform: FC<Platform> = ({ coords }) => {
  const points = coords
    .reduce((acc, [x, y]) => `${acc}${x},${y} `, '')
    .slice(0, -1);

  return <g transform={`scale(${PIXEL_SIZE},${PIXEL_SIZE})`}>
    <polyline points={points} class="platform" />
  </g>;
};

interface Player {
  position: Observable<Vector>;
}

const Player: FC<Player> = ({ position }) => {
  const transform = position.pipe(
    map(position => `translate(${position[0]},${position[1]})`),
    map(transform => `${transform} scale(${PIXEL_SIZE},${PIXEL_SIZE})`),
  );

  return <g transform={transform}>
    <polyline points="0,0 0,2" class="player" />
  </g>;
};

interface GameMapProps {
  platforms: Platform[];
  origin: Observable<Vector>;
  viewport?: BoundingBox;
}

const GameMap: FC<GameMapProps> = ({ platforms, origin }) => {
  const transform = origin.pipe(
    map(origin => `translate(${origin[0]},${origin[1]})`),
  );

  const playerPosition = origin.pipe(
    map((origin): Vector => [WIDTH / 2 - origin[0], HEIGHT / 2]),
  );

  return <svg width={WIDTH} height={HEIGHT} tabindex="0">
    <g transform={transform}>
      {platforms.map(platform => <Platform {...platform} />)}
      <Player position={playerPosition} />
    </g>
  </svg>;
};

const testPlatforms: Platform[] = [
  { coords: [[0, 6], [15, 6]] },
  { coords: [[17, 5], [20, 5]] },
  // { coords: [[4, 1], [7, 1]] },
];

const KEY_MAP: Record<string, Vector> = {
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export const PlatformerGame = () => {
  const origin = new BehaviorSubject<Vector>([0, 0]);
  const handleKeydown = (event: Event) => {
    if (event instanceof KeyboardEvent && event.code in KEY_MAP) {
      const [x, y] = KEY_MAP[event.code];
      origin.next([origin.value[0] + x * 2, origin.value[1] + y * 2]);
    }
  };

  return <GameMap platforms={testPlatforms} origin={origin} events={{ keydown: handleKeydown }} />;
};
