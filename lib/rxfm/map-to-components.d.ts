import { Observable, OperatorFunction } from 'rxjs';
import { ElementType, Component } from './components';
declare type Id = string | number;
/**
 * An observable operator to map an array of items of type I to an array of component elements.
 * Items with matching ids between emissions will be passed to existing components rather than
 * regenerating them to more efficiently render.
 * @param idFunction A function taking an item of type I and returning it's unique id.
 * (If the creation function is passed here instead then item values will be used as their ids directly and the creation
 * function will take a non-observable item.)
 * @param creationFunction A function taking an item observable (and current item index observable if needed)
 * and returning a new component for the item.
 */
export declare function mapToComponents<I, T extends ElementType>(idFunction: (item: I, index: number) => Id, creationFunction: (item: Observable<I>, index: Observable<number>) => Component<T>): OperatorFunction<I[], ElementType[]>;
export declare function mapToComponents<I, T extends ElementType>(staticCreationFunction: (item: I) => Component<T>): OperatorFunction<I[], ElementType[]>;
export {};
