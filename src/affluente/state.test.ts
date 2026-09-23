import { BehaviorSubject } from "rxjs";
import { State } from "./state";

describe("State", () => {
  it("is a BehaviorSubject with the name pinned to State", () => {
    const count = new State(0);
    expect(count).toBeInstanceOf(BehaviorSubject);
    expect(State.name).toBe("State");
  });

  it("emits the current value on subscription and reads it via .value", () => {
    const count = new State(1);
    const seen: number[] = [];
    count.subscribe(v => seen.push(v));
    expect(count.value).toBe(1);
    expect(seen).toEqual([1]);
  });

  describe("update", () => {
    it("emits a value derived from the current one", () => {
      const count = new State(0);
      const seen: number[] = [];
      count.subscribe(v => seen.push(v));
      count.update(c => c + 1);
      count.update(c => c + 1);
      expect(seen).toEqual([0, 1, 2]);
      expect(count.value).toBe(2);
    });
  });

  describe("next dedupes by reference", () => {
    it("does not re-emit when set to the current value", () => {
      const count = new State(0);
      const seen: number[] = [];
      count.subscribe(v => seen.push(v));
      count.next(0); // same as current - suppressed
      count.next(1);
      count.next(1); // duplicate - suppressed
      count.next(2);
      expect(seen).toEqual([0, 1, 2]);
    });

    it("compares by reference, so a new object with equal contents still emits", () => {
      const items = new State<number[]>([]);
      const seen: number[][] = [];
      items.subscribe(v => seen.push(v));
      const next: number[] = [];
      items.next(next); // distinct reference, emits
      items.next(next); // same reference, suppressed
      expect(seen).toHaveLength(2);
    });

    it("suppression via update keeps .value consistent with the last emission", () => {
      const flag = new State(true);
      const seen: boolean[] = [];
      flag.subscribe(v => seen.push(v));
      flag.update(f => f); // returns the same value - suppressed
      expect(seen).toEqual([true]);
      expect(flag.value).toBe(true);
    });
  });
});
