import { ElementType } from "../components";
import { AbstractModifierService } from "../modifier-service";
import { coerceToArray } from "../utils";
import { ChildElement } from "./children";

class ChildrenMetadata {
  public blocks: { symbol: symbol, length: number }[] = [];
  public center = 0;
}

class ChildrenModifierService extends AbstractModifierService<ChildrenMetadata> {
  protected getEmptyMetadata() {
    return new ChildrenMetadata();
  }

  public setChildren(
    element: ElementType,
    symbol: symbol,
    childElements: ChildElement | ChildElement[],
    end = false,
    insertBeforeElement?: ChildElement,
  ) {
    const childrenMetadata = this.getMetadata(element);
    const children = coerceToArray(childElements);
    let index = childrenMetadata.blocks.findIndex((({ symbol: blockSymbol }) => blockSymbol === symbol));

    if (index === -1) { // If block has not yet been added, add an empty block to the metadata.
      index = childrenMetadata.center;
      childrenMetadata.blocks.splice(index, 0, { symbol, length: 0 });
      if (end) { // If block is end alligned, increment center point (would be start but operators are added in reverse order).
        childrenMetadata.center++;
      }
    }

    // Find element to insert before if available.
    let insertBefore = insertBeforeElement;
    if (!insertBeforeElement) { // If not passed in, get first element in first block following ours.
      const insertBeforeIndex = childrenMetadata.blocks.slice(0, index).reduce((count, { length }) => count + length, 0);
      insertBefore = element.childNodes[insertBeforeIndex] as ChildElement;
    }

    // TODO: Do this outside the metadata service and only pass out insertBefore element?
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
    const childrenMetadata = this.getMetadata(element);
    const block = childrenMetadata.blocks.find(({ symbol: blockSymbol }) => blockSymbol === symbol);
    if (block) { // If block exists, decrement block length.
      block.length--;
    }
    element.removeChild(child);
  }
}

export const childrenModifierService = new ChildrenModifierService();

export class TestChildrenModifierService extends ChildrenModifierService {
  public inspectMetadata(element: ElementType) {
    return this.elementMetadataMap.get(element);
  }
}
