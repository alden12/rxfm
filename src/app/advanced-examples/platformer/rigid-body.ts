import RBush from "rbush";
import { Observable } from "rxjs";
import { scan, withLatestFrom, map } from "rxjs/operators";
import { ZERO, PIXELS_PER_METER, frameTimer } from "./constants";
import { WithPrevious, Spatial, Vector, BoundingBox } from "./types";
import { addVectors, multiplyVectors } from "./utils";

export type SpatialInput = Partial<WithPrevious<Partial<Spatial>>>;

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

export const rigidBody = (boundingBox: BoundingBox) => (spatialInput: Observable<SpatialInput>) => {
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
      if (detectCollision(position, boundingBox)) {
        spatial.velocity[1] = 0;
        return spatial.position = [position[0], spatial.position[1]];
      } else {
        return spatial.position = position;
      }
    }),
  );
};

export const collider = (...boundingBoxes: BoundingBox[]) => {
  boundingBoxes.length === 1 ? spatialIndex.insert(boundingBoxes[0]) : spatialIndex.load(boundingBoxes);
  return () => boundingBoxes.forEach(box => spatialIndex.remove(box));
};
