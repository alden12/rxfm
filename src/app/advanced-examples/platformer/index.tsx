import RxFM, { FC } from "rxfm";
import { Observable, Subject } from "rxjs";
import { distinctUntilChanged, filter, finalize, map, shareReplay, startWith, tap } from "rxjs/operators";
import { BoundingBox, PressedKey, PressedKeys, Vector } from "./types";
import { addVectors, metersToPixels } from "./utils";
import { ZERO, PLAYER_SPEED, WIDTH, HEIGHT, KEY_MAP, GRAVITY, PLAYER_INITIAL_X, PLAYER_INITIAL_Y } from "./constants";
import { SpatialInput, rigidBody, collider } from "./rigid-body";

import './platformer.css';

interface Platform {
  boundingBox: BoundingBox;
}

const Platform: FC<Platform> = ({ boundingBox: [left, top, right, bottom] }) => {
  return <g transform={`translate(${metersToPixels(left)},${metersToPixels(top)})`}>
    <rect width={metersToPixels(right - left)} height={metersToPixels(bottom - top)} class="platform" />
  </g>;
};

interface GameMapProps {
  platforms: Platform[];
  position: Observable<Vector>;
}

const GameMap: FC<GameMapProps> = ({ platforms, position }) => {
  const transform = position.pipe(
    map(position => `translate(${position[0]},${position[1]})`),
  );

  const removeCollider = collider(...platforms.map(({ boundingBox }) => metersToPixels(boundingBox)));

  return (<g transform={transform}>
    {platforms.map(platform => <Platform {...platform} />)}
  </g>).pipe(
    finalize(removeCollider),
  );
};

interface PlayerProps {
  position: Observable<Vector>;
  boundingBox: BoundingBox;
}

const Player: FC<PlayerProps> = ({ position, boundingBox }) => {
  const transform = position.pipe(
    map(position => `translate(${position[0]},${position[1]})`),
    distinctUntilChanged(),
  );

  return <g transform={transform}>
    <rect width={boundingBox[2]} height={boundingBox[3]} class="player" />
  </g>;
};

const testPlatforms: Platform[] = [
  { boundingBox: [0, 6, 15, 7] },
  { boundingBox: [17, 5, 20, 6] },
];

const playerBoundingBox: BoundingBox = [...ZERO, ...metersToPixels<Vector>([1, 2])];

export const PlatformerGame = () => {
  const keyPressSubject = new Subject<PressedKey>();
  const handleKey = (event: Event) => {
    if (event instanceof KeyboardEvent && event.code in KEY_MAP) {
      keyPressSubject.next([KEY_MAP[event.code], event.type === 'keydown']);
    }
  };

  const pressedKeys: PressedKeys = {};
  const playerPosition = keyPressSubject.pipe(
    filter(([key, pressed]) => Boolean(pressedKeys[key]) !== pressed),
    tap(([key, pressed]) => pressedKeys[key] = pressed),
    map(([key, pressed]) => {
      switch (key) {
        case 'right':
          return {velocity: previous => addVectors(previous || ZERO, [pressed ? PLAYER_SPEED : -PLAYER_SPEED, 0]) };
        case 'left':
          return { velocity: previous => addVectors(previous || ZERO, [pressed ? -PLAYER_SPEED : PLAYER_SPEED, 0]) };
        case 'up':
          return pressed ? { velocity: previous => addVectors(previous || ZERO, [0, -8]) } : {};
        default:
          return {};
      }
    }),
    startWith<SpatialInput>({ acceleration: [0, GRAVITY], position: [PLAYER_INITIAL_X, PLAYER_INITIAL_Y] }),
    rigidBody(playerBoundingBox),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  const playerApparentPosition = playerPosition.pipe(
    map(position => [PLAYER_INITIAL_X, position[1]] as Vector),
  );

  const mapPosition = playerPosition.pipe(
    map(position => [PLAYER_INITIAL_X - position[0], 0] as Vector),
  );

  return <svg width={WIDTH} height={HEIGHT} onKeyDown={handleKey} onKeyup={handleKey} tabindex="0">
    <GameMap platforms={testPlatforms} position={mapPosition} />
    <Player position={playerApparentPosition} boundingBox={playerBoundingBox} />
  </svg>;
};
