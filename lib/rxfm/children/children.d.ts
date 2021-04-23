import { Observable } from 'rxjs';
import { ComponentOperator, ElementType } from '../components';
import { StringLike, NullLike } from '../utils';
export declare type ComponentChild = StringLike | NullLike | Observable<StringLike | NullLike | ElementType | ElementType[]> | (() => Observable<ElementType>);
export declare type ChildElement = ElementType | Text;
export declare type CoercedChildComponent = ChildElement[];
export declare function children<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T>;
export declare function lastChildren<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T>;
