import RBush from "rbush";
import { PIXELS_PER_METER } from "./constants";
import { BoundingBox, Vector } from "./types";

export const addVectors = (...vectors: Vector[]) =>
  vectors.reduce<Vector>((result, vector) => [result[0] + vector[0], result[1] + vector[1]], [0, 0]);

export const multiplyVectors = (...vectors: (Vector)[]) =>
  vectors.reduce<Vector>((result, vector) => [result[0] * vector[0], result[1] * vector[1]], [1, 1]);

export function metersToPixels(meters: number): number;
export function metersToPixels<T extends number[]>(vector: T): T;
export function metersToPixels(meters: number | number[]): number | number[] {
  if (typeof meters === 'number') return meters * PIXELS_PER_METER;
  return meters.map(number => metersToPixels(number));
}

export class SpatialIndex extends RBush<BoundingBox> {
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
