import { Observable } from 'rxjs';
import { ElementType, ComponentOperator } from '../components';
import { HTMLAttributes } from './html';
import { SVGAttributes } from './svg';
import { Styles, StaticStyles } from './styles';
import { ClassType } from './classes';
import { EventType } from '../events';
export declare type TypeOrObservable<T> = T | Observable<T>;
export interface SpecialAttributes {
    class?: ClassType | ClassType[];
    style?: Styles | Observable<StaticStyles>;
}
export declare type AttributeType = string | boolean | number;
export declare type IAttributes = {
    [K in keyof (HTMLAttributes & SVGAttributes)]?: TypeOrObservable<AttributeType>;
} & SpecialAttributes;
export declare function attribute<T extends ElementType, E extends EventType = never>(type: string, value: TypeOrObservable<AttributeType>): ComponentOperator<T, E>;
export declare function attributes<T extends ElementType, E extends EventType>(attributeDict: IAttributes): ComponentOperator<T, E>;
