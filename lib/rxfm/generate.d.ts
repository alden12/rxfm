import { Observable, OperatorFunction } from 'rxjs';
import { ElementType, RxFMElement, Component } from './components';
import { EventType } from './events';
declare type Id = string | number;
export declare function generate<T, ET extends ElementType, E extends EventType = never>(creationFunction: (item: T) => Component<ET, E>): OperatorFunction<T[], RxFMElement<ET, E>[]>;
export declare function generate<T, ET extends ElementType, E extends EventType = never>(creationFunction: (item: Observable<T>) => Component<ET, E>, idFunction: (item: T) => Id): OperatorFunction<T[], RxFMElement<ET, E>[]>;
export {};
