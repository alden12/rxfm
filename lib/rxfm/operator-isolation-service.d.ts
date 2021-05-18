import { AttributeDictionary, StyleDictionary } from "./attributes";
import { ChildrenBlockMetadata } from "./children/children-operator-isolation";
import { ElementType } from "./components";
/**
 * A map of styles operator symbols to dictionaries of style names to values requested by each styles operator.
 */
declare type StylesMetadataMap = Map<symbol, StyleDictionary>;
/**
 * A map of attributes operator symbols to dictionaries of attribute names to values requested by each attributes operator.
 */
declare type AttributesMetadataMap = Map<symbol, AttributeDictionary>;
/**
 * A map of classes operator symbols to sets of class name strings requested by each classes operator.
 */
declare type ClassesMetadataMap = Map<symbol, Set<string>>;
/**
 * A class to contain the operator metadata for a element.
 */
declare class ElementMetadata {
    styles: StylesMetadataMap;
    attributes: AttributesMetadataMap;
    classes: ClassesMetadataMap;
    children: ChildrenBlockMetadata[];
}
/**
 * A service class to manage multiple component operators on single elements and ensure that they do not interfere
 * with each-other.
 */
declare class OperatorIsolationService {
    /**
     * A weak map of DOM elements to metadata objects, must be a weak map so that garbage collection is not prevented when elements
     * are removed from the DOM and go out of scope.
     */
    protected elementMetadataMap: WeakMap<ElementType, ElementMetadata>;
    getStylesMap(element: ElementType): StylesMetadataMap;
    getAttributesMap(element: ElementType): AttributesMetadataMap;
    getClassesMap(element: ElementType): ClassesMetadataMap;
    getChildrenMetadata(element: ElementType): ChildrenBlockMetadata[];
    setChildrenMetadata(element: ElementType, metadata: ChildrenBlockMetadata[]): void;
    /**
     * Get metadata for an element, element metadata will be created and added first if not present.
     */
    private getMetadata;
}
/**
 * The single instance of the operator isolation service to be used around the application.
 */
export declare const operatorIsolationService: OperatorIsolationService;
/**
 * Equivalent to the operator isolation service class but with extra methods used for testing.
 */
export declare class TestOperatorIsolationService extends OperatorIsolationService {
    inspectMetadata(element: ElementType): ElementMetadata | undefined;
}
export {};
