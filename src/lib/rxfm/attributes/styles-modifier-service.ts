import { ElementType } from "../components";
import { AbstractModifierService } from "../modifier-service";
import { StyleKeys, StyleObject, StyleType } from "./styles";

class StylesModifierService extends AbstractModifierService<Map<symbol, StyleObject>> {
  protected getEmptyMetadata() {
    return new Map<symbol, StyleObject>();
  }

  public setStyles(element: ElementType, symbol: symbol, style: StyleObject) {
    const styles = this.getMetadata(element);
    styles.set(symbol, style);
  }

  public getStyle(element: ElementType, name: StyleKeys): StyleType {
    if (this.elementMetadataMap.has(element)) {
      const styles = this.getMetadata(element);
      const style = Array.from(styles.values()).find(st => name in st);
      return style ? style[name] : undefined;
    }
    return undefined;
  }
}

export const stylesModifierService = new StylesModifierService();

export class TestStylesModifierService extends StylesModifierService {
  public inspectMetadata(element: ElementType) {
    return this.elementMetadataMap.get(element);
  }
}
