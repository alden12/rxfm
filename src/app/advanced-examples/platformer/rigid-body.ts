import RBush from "rbush";
import { Observable } from "rxjs";
import { scan, withLatestFrom, map } from "rxjs/operators";
import { PIXELS_PER_METER, frameTimer } from "./constants";
import { WithPrevious, Spatial, Vector, BoundingBox } from "./types";
import { addVectors, multiplyVectors, zero } from "./utils";

export type RigidBodyInput = Partial<WithPrevious<Partial<Spatial>>>;

export interface RigidBodyOutput extends Spatial {
  grounded: Vector;
}

class SpatialIndex extends RBush<BoundingBox> {
  public toBBox([minX, minY, maxX, maxY]: BoundingBox) {
    return { minX, minY, maxX, maxY };
  }

  public compareMinX(a: BoundingBox, b: BoundingBox) {
    return a[0] - b[0];
  }

  public compareMinY(a: BoundingBox, b: BoundingBox) {
    return a[1] - b[1];
  }
}

const spatialIndex = new SpatialIndex();

const detectCollision = ([x, y]: Vector, [left, top, right, bottom]: BoundingBox) => spatialIndex.collides({
  minX: x + left,
  minY: y + top,
  maxX: x + right,
  maxY: y + bottom,
});

const detectCollision_ = (
  position: Vector,
  previousPosition: Vector,
  velocity: Vector,
  boundingBox: BoundingBox,
): Pick<Spatial, 'position' | 'velocity'> | undefined => {
  const [x, y] = position;
  const [left, top, right, bottom] = boundingBox;
  const boxes = spatialIndex.search({
    minX: x + left,
    minY: y + top,
    maxX: x + right,
    maxY: y + bottom,
  });
  if (boxes.length === 0) return undefined;
  
  // TODO: Find which axes collides and stop velocity on those (first colliding axis along movement vector).
  // TODO: Find intersection point with colliding box along movement vector;
  
    const movementVector: Vector = [position[0] - previousPosition[0], position[1] - previousPosition[1]];
    // If movement is positive, find min axis crossing for each axis, find which axis was crossed first along movement vector.
    // Do this for all colliding boxes and use min axis crossing (or max if negative movement), this is the new positions coord in that axis.

  return { position, velocity };
};

const getVectorFromPrevious = (previous: Vector, vector?: Vector | ((previous: Vector) => Vector | undefined)) =>
  (typeof vector === 'function' ? vector(previous) : vector) || previous;

  // TODO: Also return a grounded vector in spatial?
export const rigidBody = (boundingBox: BoundingBox) => (rigidBodyInput: Observable<RigidBodyInput>): Observable<RigidBodyOutput> => {
  const spatial = rigidBodyInput.pipe(
    scan<RigidBodyInput, Spatial>((previousSpatial, spatial) => ({
      position: getVectorFromPrevious(previousSpatial.position, spatial.position),
      velocity: getVectorFromPrevious(previousSpatial.velocity, spatial.velocity),
      acceleration: getVectorFromPrevious(previousSpatial.acceleration, spatial.acceleration),
    }), {
      position: zero(),
      velocity: zero(),
      acceleration: zero(),
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
      const grounded = zero();
      if (detectCollision(position, boundingBox)) {
        spatial.velocity[1] = 0;
        spatial.position = [position[0], spatial.position[1]];
        grounded[1] = 1;
      } else {
        spatial.position = position;
      }

      return { ...spatial, grounded };
    }),
  );
};

export const collider = (...boundingBoxes: BoundingBox[]) => {
  boundingBoxes.length === 1 ? spatialIndex.insert(boundingBoxes[0]) : spatialIndex.load(boundingBoxes);
  return () => boundingBoxes.forEach(box => spatialIndex.remove(box));
};
