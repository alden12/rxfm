import { StyleKeys, StyleObject, StyleType } from "./attributes";
import { ElementType } from "./components";

class ChildrenMetadata {
  public blocks: { symbol: symbol, length: number }[] = [];
  public center = 0;
}

class ElementMetadata {
  public styles = new Map<symbol, StyleObject>();
  public classes = new Map<symbol, Set<string>>();
  public children = new ChildrenMetadata();
}

class ElementMetadataService {
  protected elementMetadataMap = new WeakMap<ElementType, ElementMetadata>();

  public setStyles(element: ElementType, symbol: symbol, style: StyleObject) {
    const styles = this.getMetadata(element).styles;
    const currentStyles = styles.get(symbol);
    styles.set(symbol, { ...currentStyles, ...style });
  }

  public getStyle(element: ElementType, name: StyleKeys): StyleType {
    if (this.elementMetadataMap.has(element)) {
      const styles = this.getMetadata(element).styles;
      const style = Array.from(styles.values()).find(st => name in st);
      return style ? style[name] : undefined;
    }
    return undefined;
  }

  public getClassSet(element: ElementType, symbol: symbol): Set<string> | undefined {
    return this.getMetadata(element).classes.get(symbol);
  }

  public setClassSet(element: ElementType, symbol: symbol, classSet: Set<string>) {
    this.getMetadata(element).classes.set(symbol, classSet);
  }

  public canRemoveClass(element: ElementType, symbol: symbol, className: string): boolean {
    return !Array.from(this.getMetadata(element).classes.entries()).some(([blockSymbol, classSet]) => {
      if (blockSymbol !== symbol) {
        return classSet.has(className);
      }
      return false;
    });
  }

  public getChildrenMetadata(element: ElementType): ChildrenMetadata {
    return this.getMetadata(element).children;
  }

  public setChildrenMetadata(element: ElementType, metadata: ChildrenMetadata) {
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
