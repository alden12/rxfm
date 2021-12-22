import RxFM, { FC, timeDelta } from "rxfm";
import { BehaviorSubject, Observable, OperatorFunction, timer } from "rxjs";
import { distinctUntilChanged, filter, map, mapTo, scan, share, startWith, withLatestFrom } from "rxjs/operators";
import { PressedKeys, Spatial, Vector } from "./types";
import { addVectors, multiplyVectors } from "./utils";
import { PIXELS_PER_METER, ZERO, FRAME_TIME_MS, PLAYER_SPEED, WIDTH, HEIGHT, KEY_MAP } from "./constants";

import './platformer.css';

interface Platform {
  coords: Vector[];
}

const Platform: FC<Platform> = ({ coords }) => {
  const points = coords
    .reduce((acc, [x, y]) => `${acc}${x},${y} `, '')
    .slice(0, -1);

  return <g transform={`scale(${PIXELS_PER_METER},${PIXELS_PER_METER})`}>
    <polyline points={points} class="platform" />
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

  return <g transform={transform}>
    {platforms.map(platform => <Platform {...platform} />)}
  </g>;
};

const testPlatforms: Platform[] = [
  { coords: [[0, 6], [15, 6]] },
  { coords: [[17, 5], [20, 5]] },
];

interface PlayerProps {
  position: Observable<Vector>;
}

const Player: FC<PlayerProps> = ({ position }) => {
  const transform = position.pipe(
    map(position => `translate(${position[0]},${position[1]})`),
    map(transform => `${transform} scale(${PIXELS_PER_METER},${PIXELS_PER_METER})`),
    distinctUntilChanged(),
  );

  return <g transform={transform}>
    <polyline points="0,0 0,2" class="player" />
  </g>;
};

const motion = (frameTimer: Observable<number>): OperatorFunction<Partial<Spatial>, Vector> => (spatial: Observable<Partial<Spatial>>) => {
  const definedSpatial = spatial.pipe(
    scan<Partial<Spatial>, Spatial>((previousSpatial, spatial) => ({
      // TODO: Allow partial vectors?
      position: spatial.position ?? previousSpatial.position,
      velocity: spatial.velocity ?? previousSpatial.velocity,
      acceleration: spatial.acceleration ?? previousSpatial.acceleration,
    }), {
      position: ZERO,
      velocity: ZERO,
      acceleration: ZERO,
    })
  );

  return frameTimer.pipe(
    withLatestFrom(definedSpatial),
    map(([timeMs, spatial]) => {
      const timeS: Vector = [timeMs / 1000, timeMs / 1000];
      spatial.velocity = addVectors(spatial.velocity, multiplyVectors(timeS, spatial.acceleration));
      const displacementM = multiplyVectors(spatial.velocity, timeS);
      const displacementPx = multiplyVectors(displacementM, [PIXELS_PER_METER, PIXELS_PER_METER]);
      return spatial.position = addVectors(spatial.position, displacementPx);
    }),
  );
};

export const PlatformerGame = () => {
  const frameTimer = timer(0, FRAME_TIME_MS).pipe(
    timeDelta(),
    share(),
  );

  const pressedKeysSubject = new BehaviorSubject<PressedKeys>({});
  const handleKey = (event: Event) => {
    if (event instanceof KeyboardEvent && event.code in KEY_MAP) {
      const direction = KEY_MAP[event.code];
      pressedKeysSubject.next({ ...pressedKeysSubject.value, [direction]: event.type === 'keydown' });
    }
  };

  const viewportOffset = pressedKeysSubject.pipe(
    map<PressedKeys, Partial<Spatial>>(({ right, left }) => {
      if (right) return { velocity: [-PLAYER_SPEED, 0] };
      if (left) return { velocity: [PLAYER_SPEED, 0] };
      return { velocity: ZERO };
    }),
    motion(frameTimer),
  );

  const playerPosition = pressedKeysSubject.pipe(
    filter(({ up }) => Boolean(up)),
    mapTo<Partial<Spatial>>({ velocity: [0, -8] }),
    startWith<Partial<Spatial>>({ acceleration: ZERO, position: [WIDTH / 2, HEIGHT / 2] }),
    motion(frameTimer),
  );

  return <svg width={WIDTH} height={HEIGHT} events={{ keydown: handleKey, keyup: handleKey }} tabindex="0">
    <GameMap platforms={testPlatforms} position={viewportOffset} />;
    <Player position={playerPosition} />
  </svg>;
};
