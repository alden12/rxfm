import { StyleKeys, StyleObject, StyleType } from "./attributes";
import { ChildElement } from "./children/children";
import { ElementType } from "./components";
import { coerceToArray } from "./utils";

class ChildrenMetadata {
  public blocks: { symbol: symbol, length: number }[] = [];
  public center = 0;
}

class ElementMetadata {
  public styles = new Map<symbol, StyleObject>();
  public children = new ChildrenMetadata();
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

  public setChildren(
    element: ElementType,
    symbol: symbol,
    childElements: ChildElement | ChildElement[],
    end = false,
    insertBeforeElement?: ChildElement,
  ) {
    const childrenMetadata = this.getMetadata(element).children;
    const children = coerceToArray(childElements);
    let index = childrenMetadata.blocks.findIndex((({ symbol: blockSymbol }) => blockSymbol === symbol));

    if (index === -1) { // If block has not yet been added, add an empty block to the metadata.
      index = childrenMetadata.center;
      childrenMetadata.blocks.splice(index, 0, { symbol, length: 0 });
      if (!end) { // If block is start alligned, increment center point.
        childrenMetadata.center++;
      }
    }

    // Find element to insert before if available.
    let insertBefore = insertBeforeElement;
    if (!insertBeforeElement) { // If not passed in, get first element in first block following ours.
      const insertBeforeIndex = childrenMetadata.blocks.slice(0, index).reduce((count, { length }) => count + length, 0);
      insertBefore = element.childNodes[insertBeforeIndex] as ChildElement;
    }

    // Insert element(s).
    if (insertBefore) { // If insert before, insert element(s) before given node.
      children.forEach(child => element.insertBefore(child, insertBefore!));
    } else { // Otherwise append element(s) to the end.
      element.append(...children);
    }

    // Update metadata by incrementing block length by element(s) length
    const block = childrenMetadata.blocks[index];
    block.length = block.length + children.length;
  }

  public removeChild(element: ElementType, symbol: symbol, child: ChildElement) {
    const childrenMetadata = this.getMetadata(element).children;
    const block = childrenMetadata.blocks.find(({ symbol: blockSymbol }) => blockSymbol === symbol);
    if (block) { // If block exists, decrement block length.
      block.length--;
    }
    element.removeChild(child);
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
