import { ReplaySubject } from "rxjs";

export class DestroySubject extends ReplaySubject<void> {
  constructor() {
    super(1);
  }

  public emitAndComplete = () => {
    this.next();
    this.complete();
  }
}
