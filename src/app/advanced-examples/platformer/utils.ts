import { Vector } from "./types";

export const addVectors = (...vectors: Vector[]) =>
  vectors.reduce<Vector>((result, vector) => [result[0] + vector[0], result[1] + vector[1]], [0, 0]);

export const multiplyVectors = (...vectors: Vector[]) =>
  vectors.reduce<Vector>((result, vector) => [result[0] * vector[0], result[1] * vector[1]], [1, 1]);
