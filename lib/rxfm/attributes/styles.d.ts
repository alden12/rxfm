import { Observable } from 'rxjs';
import { ElementType, ComponentOperator } from '../components';
import { NullLike } from '../utils';
import { EventType } from '../events';
export declare type StyleKeys = Exclude<Extract<keyof CSSStyleDeclaration, string>, 'getPropertyPriority' | 'getPropertyValue' | 'item' | 'removeProperty' | 'setProperty' | 'parentRule' | 'length'>;
export declare type StyleType = string | NullLike;
export declare type Style = StyleType | Observable<StyleType>;
export declare function style<T extends ElementType, E extends EventType, K extends StyleKeys>(name: K, value: Style): ComponentOperator<T, E>;
export declare type Styles = {
    [K in StyleKeys]?: Style;
};
export declare type StaticStyles = {
    [K in StyleKeys]?: StyleType;
};
export declare function styles<T extends ElementType, E extends EventType>(stylesDict: Styles | Observable<StaticStyles>): ComponentOperator<T, E>;
