import { childDiffer, IChildDiff } from "./child-differ";
import { ChildElement } from "./children";

/**
 * Create a distinct element whose text content is its label, so the order of a parent's children
 * can be read back as a list of labels.
 */
function element(label: string): HTMLElement {
  const el = document.createElement("div");
  el.textContent = label;
  return el;
}

/** An empty parent element to apply diffs to. */
function parentElement(): HTMLElement {
  return document.createElement("div");
}

/** Read a parent's current child order back as a list of labels. */
function labelsOf(parent: HTMLElement): string[] {
  return Array.from(parent.childNodes).map(node => node.textContent ?? "");
}

/**
 * Apply a diff to a parent exactly as the children operator does: remove the removed nodes, then
 * insert each updated node before its reference (or append it). Inserting a node already in the
 * parent moves it, which is how reordering happens.
 */
function applyDiff(parent: HTMLElement, diff: IChildDiff): void {
  diff.removed.forEach(node => parent.removeChild(node));
  diff.updated.forEach(({ node, insertBefore }) => {
    if (insertBefore) {
      parent.insertBefore(node, insertBefore);
    } else {
      parent.appendChild(node);
    }
  });
}

/** All permutations of an array. */
function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [item, ...rest]),
  );
}

describe("childDiffer", () => {
  it("reports no updates or removals when the children are unchanged", () => {
    const [a, b, c] = [element("a"), element("b"), element("c")];
    const diff = childDiffer([a, b, c], [a, b, c]);
    expect(diff.updated).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it("reports added nodes with the node to insert them before", () => {
    const [a, b, c] = [element("a"), element("b"), element("c")];
    const diff = childDiffer([a, c], [a, b, c]); // Insert b between a and c.
    expect(diff.removed).toEqual([]);
    expect(diff.updated).toEqual([{ node: b, insertBefore: c }]);
  });

  it("appends added nodes with no reference when they go at the end", () => {
    const [a, b] = [element("a"), element("b")];
    const diff = childDiffer([a], [a, b]);
    expect(diff.updated).toEqual([{ node: b, insertBefore: undefined }]);
  });

  it("reports removed nodes", () => {
    const [a, b, c] = [element("a"), element("b"), element("c")];
    const diff = childDiffer([a, b, c], [a, c]);
    expect(diff.updated).toEqual([]);
    expect(diff.removed).toEqual([b]);
  });

  // Regression: the previous heuristic kept both a and c in place even though they had swapped
  // relative order, producing [a, c, b] instead of [c, a, b].
  it("handles a rotation that swaps the relative order of kept nodes", () => {
    const [a, b, c] = [element("a"), element("b"), element("c")];
    const parent = parentElement();
    [a, b, c].forEach(el => parent.appendChild(el));
    applyDiff(parent, childDiffer([a, b, c], [c, a, b]));
    expect(labelsOf(parent)).toEqual(["c", "a", "b"]);
  });

  // Regression: a simple two-element swap previously produced no moves at all.
  it("handles a simple swap of two nodes", () => {
    const [a, b] = [element("a"), element("b")];
    const parent = parentElement();
    [a, b].forEach(el => parent.appendChild(el));
    applyDiff(parent, childDiffer([a, b], [b, a]));
    expect(labelsOf(parent)).toEqual(["b", "a"]);
  });

  it("moves only the nodes that are out of order, keeping the longest in-order run in place", () => {
    const [a, b, c, d] = [element("a"), element("b"), element("c"), element("d")];
    // a, b, c stay in order; only d moves to the front.
    const diff = childDiffer([a, b, c, d], [d, a, b, c]);
    expect(diff.removed).toEqual([]);
    expect(diff.updated).toEqual([{ node: d, insertBefore: a }]);
  });

  it("transforms old into new for every add / remove / reorder permutation of up to five nodes", () => {
    const base = ["a", "b", "c", "d", "e"];
    let caseCount = 0;

    for (let oldLength = 1; oldLength <= base.length; oldLength++) {
      const universe = base.slice(0, Math.min(oldLength + 1, base.length)); // Allow one extra node to be added.
      const elements = new Map(universe.map(label => [label, element(label)]));
      const oldLabels = base.slice(0, oldLength);
      const oldChildren = oldLabels.map(label => elements.get(label)!);

      for (let mask = 0; mask < (1 << universe.length); mask++) {
        const subset = universe.filter((_, i) => mask & (1 << i)); // Every subset of the universe...
        for (const newLabels of permutations(subset)) { // ...in every order.
          caseCount++;
          const parent = parentElement();
          oldChildren.forEach(el => parent.appendChild(el)); // Re-attach the shared elements to a fresh parent.
          const newChildren = newLabels.map(label => elements.get(label)!) as ChildElement[];
          applyDiff(parent, childDiffer(oldChildren, newChildren));
          expect(labelsOf(parent)).toEqual(newLabels);
        }
      }
    }

    expect(caseCount).toBeGreaterThan(700); // Sanity check that the sweep actually ran.
  });
});
