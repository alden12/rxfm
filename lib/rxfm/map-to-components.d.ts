import { Observable, OperatorFunction } from 'rxjs';
import { ElementType, Component } from './components';
declare type Id = string | number;
export declare function mapToComponents<I, T extends ElementType>(idFunction: (item: I, index: number) => Id, creationFunction: (item: Observable<I>) => Component<T>): OperatorFunction<I[], ElementType[]>;
export declare function mapToComponents<I, T extends ElementType>(staticCreationFunction: (item: I) => Component<T>): OperatorFunction<I[], ElementType[]>;
export {};
