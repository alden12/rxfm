import { Observable } from 'rxjs';
import { ClassType, IAttributes, Styles, StaticStyles } from '.';
import { NullLike } from '../utils';
import { EventOperators } from '../components/creator';
export declare function mergeClasses(secondaryClasses: ClassType | ClassType[] | NullLike, primaryClasses: ClassType | ClassType[] | NullLike): ClassType[];
export declare function mergeStyles(secondaryStyles: Styles | Observable<StaticStyles> | undefined, primaryStyles: Styles | Observable<StaticStyles> | undefined): Observable<StaticStyles>;
export declare function mergeAttributes<AE, A extends EventOperators<AE>>(secondaryAttributes: IAttributes, primaryAttributes: A & IAttributes): A & IAttributes;
