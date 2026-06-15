import { Subject } from "rxjs";
import { DestroySubject } from "./destroySubject";

// DestroySubject is deprecated but still shipped; these lock in its behaviour.
describe("DestroySubject", () => {
  it("completes an untilDestroy source when destroyed", () => {
    const destroy = new DestroySubject();
    const source = new Subject<number>();
    const values: number[] = [];
    let completed = false;
    destroy.untilDestroy(source).subscribe({
      next: value => values.push(value),
      complete: () => { completed = true; },
    });

    source.next(1);
    destroy.destroy();
    source.next(2); // ignored — the source has been unsubscribed by takeUntil

    expect(values).toEqual([1]);
    expect(completed).toBe(true);
  });

  it("emits (and replays) a value when destroyed", async () => {
    const destroy = new DestroySubject();
    destroy.destroy();
    await expect(destroy.toPromise()).resolves.toBeUndefined(); // replay of the completion value
  });
});
