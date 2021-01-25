import { Observable, of, Subject } from "rxjs";
import { filter, first, mapTo, tap } from "rxjs/operators";
import { componentOperator, ComponentOperator, ElementType } from "./components";

export interface IMetaDataField<T> {
  first: T[];
  last: T[];
}

export interface IElementMetaData { }

class ElementMetadataService {
  private elementMetadataMap = new WeakMap<ElementType, IElementMetaData>();

  private elementCreateSubject = new Subject<ElementType>();
  private elementDeleteSubject = new Subject<ElementType>();
  public elementCreate = this.elementCreateSubject.asObservable();
  public elementDelete = this.elementDeleteSubject.asObservable();

  public hasElement(element: ElementType): boolean {
    return this.elementMetadataMap.has(element);
  }

  public setElement(element: ElementType) {
    if (!this.hasElement(element)) {
      this.elementMetadataMap.set(element, {});
      this.elementCreateSubject.next(element);
    }
  }

  public deleteElement(element: ElementType) {
    if (this.hasElement(element)) {
      this.elementMetadataMap.delete(element);
      this.elementDeleteSubject.next(element);
    }
  }

  public watchDelete(element: ElementType): Observable<null> {
    return this.elementDelete.pipe(
      filter(el => el === element),
      mapTo(null),
      first(),
    );
  }
}

export const elementMetadataService = new ElementMetadataService();

export function onDestroy<T extends ElementType>(callback: () => void): ComponentOperator<T> {
  return componentOperator(element => elementMetadataService.watchDelete(element).pipe(
    tap(callback),
  ));
}

export function onCreate<T extends ElementType>(callback: () => void): ComponentOperator<T> {
  return componentOperator(() => of(null).pipe(
    tap(callback),
  ));
}
