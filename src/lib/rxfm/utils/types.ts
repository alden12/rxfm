import { Observable } from "rxjs";

export type NullLike = null | undefined | false;

export type StringLike = string | number;

export type TypeOrObservable<T> = T | Observable<T>;

export type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;
