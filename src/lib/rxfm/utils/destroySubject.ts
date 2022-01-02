import { lastValueFrom, Observable, ReplaySubject } from "rxjs";
import { takeUntil } from "rxjs/operators";

/**
 * @deprecated
 */
export class DestroySubject extends ReplaySubject<void> {
  constructor() {
    super(1);
  }

  public next = () => super.next();

  public complete = () => {
    super.next();
    super.complete();
  };

  public destroy = () => this.complete();

  public untilDestroy = <T>(source: Observable<T>) => source.pipe(
    takeUntil(this),
  );

  public toPromise = (): Promise<void> => lastValueFrom(this);
}
