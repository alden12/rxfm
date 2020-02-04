import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IComponent } from '../component';

export type ChildComponent<E = undefined> = string | number | Observable<string | number | IComponent<any, E> | IComponent<any, E>[]>;

export function coerceChildComponent<E = undefined>(childComponent: ChildComponent): Observable<IComponent<any, E>[]> {
  if (childComponent instanceof Observable) {
    let textNode: Text;
    return childComponent.pipe(
      map(child => {
        if (typeof child === "string" || typeof child === 'number') {
          textNode = textNode || document.createTextNode('');
          textNode.nodeValue = typeof child === 'number' ? child.toString() : child;
          return [textNode];
        }
        return Array.isArray(child) ? child : [child];
      }),
    );
  } else {
    const node = typeof childComponent === 'number' ? childComponent.toString() : childComponent;
    return of([child]);
    // const nodeOrStringArray = Array.isArray(childElement)
    //   ? childElement
    //   : [childElement];
    // const nodeArray = nodeOrStringArray.map(nodeOrString =>
    //   typeof nodeOrString === "string"
    //     ? document.createTextNode(nodeOrString)
    //     : nodeOrString
    // );
    // return of(nodeArray);
  }
}
