import RxFM, { FC, timeDelta } from "rxfm";
import { BehaviorSubject, Observable, of, timer } from "rxjs";
import { distinctUntilChanged, map, pairwise, scan, share, startWith, withLatestFrom } from "rxjs/operators";
import { BoundingBox, PressedKeys, Spatial, Vector, WithPrevious } from "./types";
import { addVectors, metersToPixels, multiplyVectors, SpatialIndex } from "./utils";
import { PIXELS_PER_METER, ZERO, FRAME_TIME_MS, PLAYER_SPEED, WIDTH, HEIGHT, KEY_MAP, GRAVITY } from "./constants";

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

  return <g transform={transform}>
    {platforms.map(platform => <Platform {...platform} />)}
  </g>;
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

type SpatialInput = Partial<WithPrevious<Partial<Spatial>>>;

const rigidBody = (
  frameTimer: Observable<number>,
  detectCollision?: (position: Vector) => boolean,
) => (spatialInput: Observable<SpatialInput>) => {
  const spatial = spatialInput.pipe(
    scan<SpatialInput, Spatial>((previousSpatial, spatial) => ({
      position: (typeof spatial.position === 'function' ? spatial.position(previousSpatial.position) : spatial.position) ?? previousSpatial.position,
      velocity: (typeof spatial.velocity === 'function' ? spatial.velocity(previousSpatial.velocity) : spatial.velocity) ?? previousSpatial.velocity,
      acceleration: (typeof spatial.acceleration === 'function' ? spatial.acceleration(previousSpatial.acceleration) : spatial.acceleration) ?? previousSpatial.acceleration,
    }), {
      position: ZERO,
      velocity: ZERO,
      acceleration: ZERO,
    })
  );

  return frameTimer.pipe(
    withLatestFrom(spatial),
    map(([timeMs, spatial]) => {
      const timeS: Vector = [timeMs / 1000, timeMs / 1000];
      spatial.velocity = addVectors(spatial.velocity, multiplyVectors(timeS, spatial.acceleration));
      const displacementM = multiplyVectors(spatial.velocity, timeS);
      const displacementPx = multiplyVectors(displacementM, [PIXELS_PER_METER, PIXELS_PER_METER]);
      const position = addVectors(spatial.position, displacementPx);
      
      // TODO: Calculate proper resting position of object based on colliding objects, to rest on surface.
      if (detectCollision && detectCollision(position)) {
        spatial.velocity[1] = 0;
        return spatial.position = [position[0], spatial.position[1]];
      } else {
        return spatial.position = position;
      }
    }),
  );
};

const testPlatforms: Platform[] = [
  { boundingBox: [0, 6, 15, 7] },
  { boundingBox: [17, 5, 20, 6] },
];

const playerBoundingBox: BoundingBox = [...ZERO, ...metersToPixels<Vector>([1, 2])];

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

  // const viewportOffset = pressedKeysSubject.pipe(
  //   map<PressedKeys, Partial<Spatial>>(({ right, left }) => {
  //     if (right) return { velocity: [-PLAYER_SPEED, 0] };
  //     if (left) return { velocity: [PLAYER_SPEED, 0] };
  //     return { velocity: ZERO };
  //   }),
  //   physics(frameTimer),
  // );

  const spatialIndex = new SpatialIndex();
  spatialIndex.load(testPlatforms.map(({ boundingBox }) => metersToPixels(boundingBox)));

  const detectCollision = ([left, top, right, bottom]: BoundingBox) => ([x, y]: Vector) => spatialIndex.collides({
    minX: x + left,
    minY: y + top,
    maxX: x + right,
    maxY: y + bottom,
  });

  const playerPosition = pressedKeysSubject.pipe(
    startWith<PressedKeys>({}),
    pairwise(),
    map(([a, b]) => {
      const spatial: SpatialInput = {};
      if (a.right !== b.right) {
        spatial.velocity = previous => addVectors(previous || ZERO, [b.right ? PLAYER_SPEED : -PLAYER_SPEED, 0]);
      }
      if (a.left !== b.left) {
        spatial.velocity = previous => addVectors(previous || ZERO, [b.left ? -PLAYER_SPEED : PLAYER_SPEED, 0]);
      }
      if (b.up && a.up !== b.up) {
        spatial.velocity = previous => addVectors(previous || ZERO, [0, -8]);
      }
      return spatial;
    }),
    startWith<SpatialInput>({ acceleration: [0, GRAVITY], position: [WIDTH / 2, HEIGHT / 2 - 20] }),
    rigidBody(frameTimer, detectCollision(playerBoundingBox)),
  );

  return <svg width={WIDTH} height={HEIGHT} events={{ keydown: handleKey, keyup: handleKey }} tabindex="0">
    <GameMap platforms={testPlatforms} position={of(ZERO)} />
    <Player position={playerPosition} boundingBox={playerBoundingBox} />
  </svg>;
};
