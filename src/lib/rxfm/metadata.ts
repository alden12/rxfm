import { StyleKeys, StyleObject, StyleType } from "./attributes";
import { ElementType } from "./components";

class ElementMetadata {
  public styles = new Map<symbol, StyleObject>();
}

class ElementMetadataService {
  private elementMetadataMap = new WeakMap<ElementType, ElementMetadata>();

  public setStyles(element: ElementType, symbol: symbol, style: StyleObject) {
    const styles = this.getMetadata(element).styles;
    styles.set(symbol, style);
  }

  public getStyle(element: ElementType, name: StyleKeys): StyleType {
    if (this.elementMetadataMap.has(element)) {
      const styles = this.getMetadata(element).styles;
      const style = Array.from(styles.values()).find(st => name in st);
      return style ? style[name] : undefined;
    }
    return undefined;
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
