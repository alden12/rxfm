import RxFM, { FC, timeDelta } from "rxfm";
import { BehaviorSubject, Observable, OperatorFunction, pipe, timer } from "rxjs";
import { distinctUntilChanged, map, mapTo, scan, share, withLatestFrom } from "rxjs/operators";
import { Vector } from "./types";

import './platformer.css';
import { addVectors, multiplyVectors } from "./utils";

interface Platform {
  coords: Vector[];
}

const PIXELS_PER_METER = 20;

const WIDTH = PIXELS_PER_METER * 20;
const HEIGHT = PIXELS_PER_METER * 7;

const FRAME_TIME_MS = 20;

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

type Direction = 'up' | 'down' | 'left' | 'right';

const KEY_MAP: Record<string, Direction> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const GRAVITY = 9.81;

// const gravity = (grounded: Observable<boolean>) => {
//   let velocityMs = 0;
//   return pipe(
//     withLatestFrom(grounded),
//     scan((previousVector, [, grounded]) => {
//       const timeS = FRAME_TIME_MS / 1000;
//       if (grounded) velocityMs = 0;
//       velocityMs = velocityMs + timeS * GRAVITY;
//       const displacementM = velocityMs * timeS;
//       const displacementPx = displacementM * PIXELS_PER_METER;
//       return addVectors(previousVector, [0, displacementPx]);
//     }, [0, 0] as Vector),
//   );
// };

interface Spatial {
  position: Vector;
  velocity: Vector;
  acceleration: Vector;
}

const ZERO: Vector = [0, 0];

const motion = (spatial: Observable<Partial<Spatial>>): OperatorFunction<number, Vector> => {
  const definedSpatial = spatial.pipe(
    scan<Partial<Spatial>, Spatial>((previousSpatial, spatial) => ({
      position: spatial.position ?? previousSpatial.position,
      velocity: spatial.velocity ?? previousSpatial.velocity,
      acceleration: spatial.acceleration ?? previousSpatial.acceleration,
    }), {
      position: ZERO,
      velocity: ZERO,
      acceleration: ZERO,
    })
  );

  return (frameTimer: Observable<number>) => frameTimer.pipe(
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

  // TODO: Allow multiple keys to be pressed at once.
  const directionSubject = new BehaviorSubject<Direction | undefined>(undefined);
  const handleKey = (event: Event) => {
    if (event instanceof KeyboardEvent && event.code in KEY_MAP) {
      directionSubject.next(event.type === 'keydown' ? KEY_MAP[event.code] : undefined);
    }
  };

  const viewportOffset = frameTimer.pipe(
    withLatestFrom(directionSubject),
    scan((offset, [, direction]) => {
      switch (direction) {
        case 'left':
          // TODO: Convert to movement speed.
          return addVectors(offset, [1, 0]);
        case 'right':
          return addVectors(offset, [-1, 0]);
        default:
          return offset;
      }
    }, [0, 0] as Vector),
  );

  // const playerPosition = frameTimer.pipe(
  //   withLatestFrom(directionSubject),
  //   scan((offset, [, direction]) => {
  //     switch (direction) {
  //       case 'up':
  //         return addVectors(offset, [0, -1]);
  //       case 'down':
  //         return addVectors(offset, [0, 1]);
  //       default:
  //         return offset;
  //     }
  //   }, [WIDTH / 2, HEIGHT / 2] as Vector),
  //   // gravity(of(true)),
  // );
  const playerPosition = frameTimer.pipe(
    motion(directionSubject.pipe(
      mapTo({ acceleration: [0, 0], position: [WIDTH / 2, HEIGHT / 2] }),
    ))
  );

  return <svg width={WIDTH} height={HEIGHT} events={{ keydown: handleKey, keyup: handleKey }} tabindex="0">
    <GameMap platforms={testPlatforms} position={viewportOffset} />;
    <Player position={playerPosition} />
  </svg>;
};
