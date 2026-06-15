import { BehaviorSubject, Observable, of, Subject, Subscription } from "rxjs";
import {
  coerceToObservable,
  coerceToArray,
  recursiveFlatten,
  select,
  selectFrom,
  destructure,
  watch,
  using,
  access,
  conditional,
  reuse,
  not,
  and,
  nand,
  or,
  nor,
  equals,
  log,
  switchTap,
} from "./utils";

/** Subscribe to an observable and collect its synchronous emissions into an array. */
function collect<T>(observable: Observable<T>): { values: T[]; subscription: Subscription } {
  const values: T[] = [];
  const subscription = observable.subscribe(value => values.push(value));
  return { values, subscription };
}

describe("coerceToObservable", () => {
  it("wraps a plain value in an observable", () => {
    expect(collect(coerceToObservable(5)).values).toEqual([5]);
  });

  it("passes an observable through unchanged", () => {
    const source = of(5);
    expect(coerceToObservable(source)).toBe(source);
  });
});

describe("coerceToArray", () => {
  it("wraps a plain value in an array", () => {
    expect(coerceToArray(5)).toEqual([5]);
  });

  it("passes an array through unchanged", () => {
    const array = [1, 2];
    expect(coerceToArray(array)).toBe(array);
  });
});

describe("recursiveFlatten", () => {
  it("flattens arbitrarily nested arrays", () => {
    expect(recursiveFlatten([1, [2, [3, [4]]], 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it("wraps a bare scalar", () => {
    expect(recursiveFlatten(5)).toEqual([5]);
  });
});

describe("select", () => {
  it("emits the selected key and only re-emits when it changes", () => {
    const source = new BehaviorSubject({ a: 1, b: 1 });
    const { values } = collect(source.pipe(select("a")));
    source.next({ a: 1, b: 2 }); // a unchanged → no emission
    source.next({ a: 2, b: 2 }); // a changed → emits
    expect(values).toEqual([1, 2]);
  });

  it("selects nested keys", () => {
    const source = of({ a: { b: { c: 7 } } });
    expect(collect(source.pipe(select("a", "b", "c"))).values).toEqual([7]);
  });
});

describe("selectFrom", () => {
  it("selects a key from a source observable", () => {
    const source = new BehaviorSubject({ a: 1 });
    const { values } = collect(selectFrom(source, "a"));
    source.next({ a: 1 }); // unchanged
    source.next({ a: 5 });
    expect(values).toEqual([1, 5]);
  });
});

describe("destructure", () => {
  it("exposes each property as its own distinct observable", () => {
    const source = new BehaviorSubject({ a: 1, b: 2 });
    const { a, b } = destructure(source);
    const collectedA = collect(a);
    const collectedB = collect(b);
    source.next({ a: 1, b: 3 }); // only b changes
    expect(collectedA.values).toEqual([1]);
    expect(collectedB.values).toEqual([2, 3]);
  });
});

describe("watch", () => {
  it("maps the source and only emits distinct results", () => {
    const source = new BehaviorSubject(2);
    const { values } = collect(source.pipe(watch(n => n % 2)));
    source.next(4); // 4 % 2 === 0, same as before → no emission
    source.next(5); // 5 % 2 === 1 → emits
    expect(values).toEqual([0, 1]);
  });
});

describe("using", () => {
  it("maps emissions through the action, emitting distinct results", () => {
    const source = new BehaviorSubject(1);
    const { values } = collect(using(source, n => n * 10));
    source.next(1); // unchanged
    source.next(2);
    expect(values).toEqual([10, 20]);
  });
});

describe("access", () => {
  it("reads a key (observable) from a static object", () => {
    const value = { a: 1, b: 2 };
    const key = new BehaviorSubject<keyof typeof value>("a");
    const { values } = collect(access(value, key));
    key.next("b");
    expect(values).toEqual([1, 2]);
  });

  it("reads a static key from an object observable", () => {
    const value = new BehaviorSubject({ a: 1, b: 2 });
    const { values } = collect(access(value, "a"));
    value.next({ a: 9, b: 2 });
    expect(values).toEqual([1, 9]);
  });
});

describe("conditional", () => {
  it("switches between then/else as the source toggles", () => {
    const source = new BehaviorSubject<boolean>(true);
    const { values } = collect(conditional(source, "yes", "no"));
    source.next(false);
    source.next(true);
    expect(values).toEqual(["yes", "no", "yes"]);
  });

  it("defaults the else branch to undefined", () => {
    const source = new BehaviorSubject<boolean>(false);
    expect(collect(conditional(source, "yes")).values).toEqual([undefined]);
  });

  it("accepts observable then/else values", () => {
    const source = new BehaviorSubject<boolean>(true);
    const then = new BehaviorSubject("a");
    const { values } = collect(conditional(source, then, of("b")));
    then.next("a2"); // active branch updates
    source.next(false);
    expect(values).toEqual(["a", "a2", "b"]);
  });

  it("supports the deprecated options-object form", () => {
    const source = new BehaviorSubject<boolean>(true);
    const { values } = collect(conditional({ if: source, then: "yes", else: "no" }));
    source.next(false);
    expect(values).toEqual(["yes", "no"]);
  });
});

describe("reuse", () => {
  it("shares a single subscription among subscribers", () => {
    let subscribeCount = 0;
    const shared = reuse(new Observable<number>(observer => {
      subscribeCount++;
      observer.next(1);
    }));
    collect(shared);
    collect(shared);
    expect(subscribeCount).toBe(1);
  });
});

describe("boolean logic", () => {
  it("not inverts truthiness", () => {
    expect(collect(not(of(0))).values).toEqual([true]);
    expect(collect(not(of("x"))).values).toEqual([false]);
  });

  it("and emits true only when all sources are truthy", () => {
    const a = new BehaviorSubject<unknown>(1);
    const b = new BehaviorSubject<unknown>(1);
    const { values } = collect(and(a, b));
    b.next(0);
    expect(values).toEqual([true, false]);
  });

  it("or emits true when any source is truthy", () => {
    const a = new BehaviorSubject<unknown>(0);
    const b = new BehaviorSubject<unknown>(0);
    const { values } = collect(or(a, b));
    b.next(1);
    expect(values).toEqual([false, true]);
  });

  it("nand is the negation of and", () => {
    expect(collect(nand(of(1), of(1))).values).toEqual([false]);
    expect(collect(nand(of(1), of(0))).values).toEqual([true]);
  });

  it("nor is the negation of or", () => {
    expect(collect(nor(of(0), of(0))).values).toEqual([true]);
    expect(collect(nor(of(1), of(0))).values).toEqual([false]);
  });
});

describe("equals", () => {
  it("emits whether all sources are equal, mixing static and observable inputs", () => {
    const a = new BehaviorSubject(1);
    const { values } = collect(equals(a, 1));
    a.next(2);
    a.next(1);
    expect(values).toEqual([true, false, true]);
  });
});

describe("log", () => {
  let spy: jest.SpyInstance;
  beforeEach(() => { spy = jest.spyOn(console, "log").mockImplementation(() => undefined); });
  afterEach(() => { spy.mockRestore(); });

  it("mirrors the source unchanged", () => {
    expect(collect(of(3).pipe(log())).values).toEqual([3]);
  });

  it("logs with a string prefix", () => {
    collect(of(3).pipe(log("value:")));
    expect(spy).toHaveBeenCalledWith("value:", 3);
  });

  it("logs the result of a formatter function", () => {
    collect(of(3).pipe(log<number>(v => `got ${v}`)));
    expect(spy).toHaveBeenCalledWith("got 3");
  });
});

describe("switchTap", () => {
  it("mirrors the source and ignores the effect observable emissions", () => {
    const source = new BehaviorSubject("a");
    const effect = new Subject<string>();
    const { values } = collect(source.pipe(switchTap(() => effect)));
    effect.next("ignored");
    source.next("b");
    expect(values).toEqual(["a", "b"]);
  });

  it("runs the effect for each distinct source emission", () => {
    const source = new BehaviorSubject("a");
    const seen: string[] = [];
    collect(source.pipe(switchTap(value => {
      seen.push(value);
      return of(null);
    })));
    source.next("a"); // distinct guard → effect not re-run
    source.next("b");
    expect(seen).toEqual(["a", "b"]);
  });
});
