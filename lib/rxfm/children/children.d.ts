import { Observable } from 'rxjs';
import { ComponentOperator, ElementType } from '../components';
import { StringLike, NullLike } from '../utils';
/**
 * The possible types which may be passed as a component child.
 */
export declare type ComponentChild = StringLike | NullLike | Observable<StringLike | NullLike | ElementType | ElementType[]> | (() => Observable<ElementType>);
/**
 * The possible types which may be used as a child element.
 */
export declare type ChildElement = ElementType | Text;
/**
 * A component operator to add children to a component. If other instances of the children operator exist on a given component,
 * children will be added after those of the previous operators.
 * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
 * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
 * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
 * arrays of components (see the 'mapToComponents' operator).
 */
export declare function children<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T>;
/**
 * A component operator to add children to the end of a component, after those added by the children operator.
 * If other instances of the lastChildren operator exist on a given component, children will be added before those of the previous
 * operators.
 * @param childComponents A spread array of ChildComponent type to add to this component. These may take a number of
 * forms, the simplest of which are strings, numbers, booleans, or observables emitting any of these. Other components
 * may also be passed. Finally Observables emitting component arrays may be passed, this is used for adding dynamic
 * arrays of components (see the 'mapToComponents' operator).
 */
export declare function lastChildren<T extends ElementType>(...childComponents: ComponentChild[]): ComponentOperator<T>;
