import { Observable } from "rxjs";
export declare type NullLike = null | undefined | false;
export declare type StringLike = string | number;
export declare type TypeOrObservable<T> = T | Observable<T>;
export declare type PartialRecord<K extends string | number | symbol, T> = Partial<Record<K, T>>;
