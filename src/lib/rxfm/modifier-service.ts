import { ElementType } from "./components";

export abstract class AbstractModifierService<T> {
  protected elementMetadataMap = new WeakMap<ElementType, T>();

  protected abstract getEmptyMetadata(): T;

  protected getMetadata(element: ElementType): T {
    const metadata = this.elementMetadataMap.get(element);
    if (!metadata) {
      const initialMetadata = this.getEmptyMetadata();
      this.elementMetadataMap.set(element, initialMetadata);
      return initialMetadata;
    }
    return metadata;
  }
}
