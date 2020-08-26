import { Observable } from 'rxjs';
import { ElementType, ComponentOperator } from '../components';
import { NullLike } from '../utils';
import { EventType } from '../events';
export declare type StyleKeys = Extract<keyof CSSStyleDeclaration, string>;
export declare type StyleType<K extends StyleKeys> = CSSStyleDeclaration[K] | NullLike;
export declare type Style<K extends StyleKeys> = StyleType<K> | Observable<StyleType<K>>;
export declare function style<T extends ElementType, E extends EventType, K extends StyleKeys>(name: K, value: Style<K>): ComponentOperator<T, E>;
export declare type Styles = {
    [K in StyleKeys]?: Style<K>;
};
export declare type StylesOrNull = {
    [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] | null;
};
export declare function styles<T extends ElementType, E extends EventType>(stylesDict: Styles | Observable<StylesOrNull>): ComponentOperator<T, E>;
