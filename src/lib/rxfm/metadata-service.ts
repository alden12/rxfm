import { AttributeObject, StyleDictionary } from "./attributes";
import { ChildrenBlockMetadata } from "./children/children-metadata";
import { ElementType } from "./components";

class ElementMetadata {
  public styles = new Map<symbol, StyleDictionary>();
  public attributes = new Map<symbol, AttributeObject>();
  public classes = new Map<symbol, Set<string>>();
  public children: ChildrenBlockMetadata[] = [];
}

class ElementMetadataService {
  protected elementMetadataMap = new WeakMap<ElementType, ElementMetadata>();

  public getStylesMap(element: ElementType): Map<symbol, StyleDictionary> {
    return this.getMetadata(element).styles;
  }

  public getAttributesMap(element: ElementType): Map<symbol, StyleDictionary> {
    return this.getMetadata(element).attributes;
  }

  public getClassesMap(element: ElementType): Map<symbol, Set<string>> {
    return this.getMetadata(element).classes;
  }

  public getChildrenMetadata(element: ElementType): ChildrenBlockMetadata[] {
    return this.getMetadata(element).children;
  }

  public setChildrenMetadata(element: ElementType, metadata: ChildrenBlockMetadata[]) {
    this.getMetadata(element).children = metadata;
  }

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

export const elementMetadataService = new ElementMetadataService();

export class TestElementMetadataService extends ElementMetadataService {
  public inspectMetadata(element: ElementType) {
    return this.elementMetadataMap.get(element);
  }
}
