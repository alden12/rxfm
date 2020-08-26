import { Observable } from 'rxjs';
import { ComponentOperator, ElementType } from '../components';
import { EventType } from '../events';
import { NullLike } from '../utils';
export declare type ClassSingle = string | NullLike;
/**
 * The possible types to pass as a CSS class name to the 'classes' operator.
 */
export declare type ClassType = ClassSingle | Observable<ClassSingle | ClassSingle[]>;
/**
 * An observable operator to manage the CSS classes on an RxFM component.
 * @param classNames A spread array of class names. These may either be of type string, string observable or string
 * array observable. If the class name value is falsy (false, undefined, null , 0) The class will be removed.
 */
export declare function classes<T extends ElementType, E extends EventType>(...classNames: ClassType[]): ComponentOperator<T, E>;
