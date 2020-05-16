import { ElementType, Component, ComponentObservable } from './component';
import { ChildComponent, children, ChildEvents } from '../children/children';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dictionary } from '../utils';

export function componentFactory<T extends ElementType>(
  elementCreationFunction: () => T,
) {
  function createComponent(): ComponentObservable<T>
  function createComponent(attributes: Dictionary<string>): ComponentObservable<T>
  function createComponent<C extends ChildComponent<ElementType, any>[]>(
    ...childComponents: C
  ): ComponentObservable<T, ChildEvents<C>>
  function createComponent<C extends ChildComponent<ElementType, any>[]>(
    attributes?: Dictionary<string>,
    ...childComponents: C
  ): ComponentObservable<T, ChildEvents<C>>
  function createComponent(
    attributes?: Dictionary<string> | ChildComponent<ElementType, any>,
    ...childComponents: ChildComponent<ElementType, any>[]
  ): ComponentObservable<T, any> {

    const _childComponents = (attributes instanceof Observable || typeof attributes !== 'object') ?
      [attributes, ...childComponents] : childComponents;
    const _attributes = (attributes instanceof Observable || typeof attributes !== 'object' || !attributes) ? {} : attributes;

    return of(elementCreationFunction).pipe(
      map(elementFn => new Component(elementFn())),
      children(..._childComponents),
    );
  }

  return createComponent;
}
