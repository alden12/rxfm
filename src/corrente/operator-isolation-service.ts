import { AttributeDictionary, StyleDictionary } from "./attributes";
import { ChildrenBlockMetadata } from "./children/children-operator-isolation";
import { ElementType } from "./components";

/**
 * A map of styles operator symbols to dictionaries of style names to values requested by each styles operator.
 */
type StylesMetadataMap = Map<symbol, StyleDictionary>;

/**
 * A map of attributes operator symbols to dictionaries of attribute names to values requested by each attributes operator.
 */
type AttributesMetadataMap = Map<symbol, AttributeDictionary>;

/**
 * A map of classes operator symbols to sets of class name strings requested by each classes operator.
 */
type ClassesMetadataMap = Map<symbol, Set<string>>;

/**
 * A class to contain the operator metadata for a element.
 */
class ElementMetadata {
  public styles: StylesMetadataMap = new Map<symbol, StyleDictionary>();
  public attributes: AttributesMetadataMap = new Map<symbol, AttributeDictionary>();
  public classes: ClassesMetadataMap = new Map<symbol, Set<string>>();
  public children: ChildrenBlockMetadata[] = [];
}

/**
 * A service class to manage multiple component operators on single elements and ensure that they do not interfere
 * with each-other.
 */
class OperatorIsolationService {
  /**
   * A weak map of DOM elements to metadata objects, must be a weak map so that garbage collection is not prevented when elements
   * are removed from the DOM and go out of scope.
   */
  protected elementMetadataMap = new WeakMap<ElementType, ElementMetadata>();

  public getStylesMap(element: ElementType): StylesMetadataMap {
    return this.getMetadata(element).styles;
  }

  public getAttributesMap(element: ElementType): AttributesMetadataMap {
    return this.getMetadata(element).attributes;
  }

  public getClassesMap(element: ElementType): ClassesMetadataMap {
    return this.getMetadata(element).classes;
  }

  public getChildrenMetadata(element: ElementType): ChildrenBlockMetadata[] {
    return this.getMetadata(element).children;
  }

  public setChildrenMetadata(element: ElementType, metadata: ChildrenBlockMetadata[]) {
    this.getMetadata(element).children = metadata;
  }

  /**
   * Get metadata for an element, element metadata will be created and added first if not present.
   */
  private getMetadata(element: ElementType): ElementMetadata {
    const metadata = this.elementMetadataMap.get(element);
    if (!metadata) {
      const initialMetadata = new ElementMetadata();
      this.elementMetadataMap.set(element, initialMetadata);
      return initialMetadata;
    }
    return metadata;
  }
}

/**
 * The single instance of the operator isolation service to be used around the application.
 */
export const operatorIsolationService = new OperatorIsolationService();

/**
 * Equivalent to the operator isolation service class but with extra methods used for testing.
 */
export class TestOperatorIsolationService extends OperatorIsolationService {
  public inspectMetadata(element: ElementType) {
    return this.elementMetadataMap.get(element);
  }
}
