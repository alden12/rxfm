import { TestOperatorIsolationService } from "./operator-isolation-service";
import { ChildrenBlockMetadata } from "./children/children-operator-isolation";

describe("OperatorIsolationService", () => {
  let service: TestOperatorIsolationService;
  let element: HTMLElement;

  beforeEach(() => {
    service = new TestOperatorIsolationService();
    element = document.createElement("div");
  });

  it("has no metadata for an untouched element", () => {
    expect(service.inspectMetadata(element)).toBeUndefined();
  });

  it("lazily creates metadata on first access", () => {
    service.getStylesMap(element);
    expect(service.inspectMetadata(element)).toBeDefined();
  });

  it("returns stable map instances across calls for the same element", () => {
    expect(service.getStylesMap(element)).toBe(service.getStylesMap(element));
    expect(service.getAttributesMap(element)).toBe(service.getAttributesMap(element));
    expect(service.getClassesMap(element)).toBe(service.getClassesMap(element));
  });

  it("starts each metadata collection empty", () => {
    expect(service.getStylesMap(element).size).toBe(0);
    expect(service.getAttributesMap(element).size).toBe(0);
    expect(service.getClassesMap(element).size).toBe(0);
    expect(service.getChildrenMetadata(element)).toEqual([]);
  });

  it("round-trips children metadata through get/set", () => {
    const children: ChildrenBlockMetadata[] = [{ symbol: Symbol(), length: 2 }];
    service.setChildrenMetadata(element, children);
    expect(service.getChildrenMetadata(element)).toBe(children);
  });

  it("keeps metadata for different elements isolated", () => {
    const other = document.createElement("span");
    service.getStylesMap(element).set(Symbol(), {});
    expect(service.getStylesMap(other).size).toBe(0);
    expect(service.getStylesMap(element).size).toBe(1);
  });

  it("persists mutations to a returned map", () => {
    const symbol = Symbol();
    service.getAttributesMap(element).set(symbol, { id: "x" });
    expect(service.getAttributesMap(element).get(symbol)).toEqual({ id: "x" });
  });
});
