import { BehaviorSubject, NEVER } from 'rxjs';
import { addToView } from './add-to-view';
import { ElementType } from './component';

describe('addToView', () => {
  it('appends the component element to the host', () => {
    const host = document.createElement('div');
    const element = document.createElement('span');
    addToView(new BehaviorSubject<ElementType>(element), host);
    expect(host.children[0]).toBe(element);
  });

  it('replaces the previous element when the component emits a new one', () => {
    const host = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('p');
    const component = new BehaviorSubject<ElementType>(first);
    addToView(component, host);

    component.next(second);
    expect(host.children.length).toBe(1); // replaced, not appended
    expect(host.children[0]).toBe(second);
  });

  it('removes the element and stops updating once the remove function is called', () => {
    const host = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('p');
    const component = new BehaviorSubject<ElementType>(first);
    const remove = addToView(component, host);

    remove();
    expect(host.children.length).toBe(0);

    component.next(second); // subscription torn down → no re-add
    expect(host.children.length).toBe(0);
  });

  it('does not throw when removed before the component has emitted', () => {
    const host = document.createElement('div');
    const remove = addToView(NEVER, host); // never emits an element
    expect(() => remove()).not.toThrow();
    expect(host.children.length).toBe(0);
  });
});
