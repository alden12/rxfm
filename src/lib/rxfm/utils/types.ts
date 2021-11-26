import { Observable } from "rxjs";

export type NullLike = null | undefined | false;

export type StringLike = string | number;

export type TypeOrObservable<T> = T | Observable<T>;

export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;

/**
 * A type to extract all keys from type T which have a corresponding value matching type V.
 */
export type KeysOfValue<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T];
