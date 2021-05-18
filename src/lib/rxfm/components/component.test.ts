import { Observable } from "rxjs";
import { delay } from "rxjs/operators";
import { DestroySubject } from "../utils";
import { Div } from "./html";

describe('component', () => {
  it('should return an observable from a component creator function', () => {
    const testComponent = Div();
    expect(testComponent).toBeInstanceOf(Observable);
  });

  it('should emit an HTMDivLElement when a Div component is subscribed', done => {
    const { destroy, untilDestroy } = new DestroySubject();

    const testComponent = Div();
    testComponent.pipe(untilDestroy).subscribe(element => {
      expect(element).toBeInstanceOf(HTMLDivElement);
      destroy();
      done();
    });
  });

  it('should have have a text child with the correct value when text is passed as a component child', done => {
    const { destroy, untilDestroy } = new DestroySubject();

    const testChild = 'Hello, World!';
    const testComponent = Div(testChild);
    testComponent.pipe(
      delay(0),
      untilDestroy,
    ).subscribe(element => {
      expect(element.firstChild?.textContent).toEqual(testChild);
      destroy();
      done();
    });
  });
});
