import { ComponentCreatorFunction } from './creator';
export declare type SVGElementTypes = {
    [K in keyof SVGElementTagNameMap]: K;
};
export declare type SVGComponentCreators = {
    [K in keyof SVGElementTagNameMap]: ComponentCreatorFunction<SVGElementTagNameMap[K]>;
};
export declare const SVG: SVGComponentCreators;
export declare const svg: ComponentCreatorFunction<SVGSVGElement, never>;
export declare const g: ComponentCreatorFunction<SVGGElement, never>;
