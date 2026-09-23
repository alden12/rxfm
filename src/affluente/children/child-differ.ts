import { ChildElement } from "./children";

/**
 * An interface to describe how a node should be added to a parent node.
 */
export interface INodeUpdate {
  /**
   * The node to add.
   */
  node: ChildElement;
  /**
   * The node to insert this node before, if omitted, insert at the end.
   */
  insertBefore?: ChildElement;
}

/**
 * An interface describing the difference between two states of an element's child nodes.
 */
export interface IChildDiff {
  /**
   * The nodes to add and where to add them.
   */
  updated: INodeUpdate[];
  /**
   * The nodes to remove.
   */
  removed: ChildElement[];
}

/**
 * Given a sequence of numbers, return the set of array positions which form a longest
 * strictly-increasing subsequence. Computed in O(n log n) via patience sorting, keeping predecessor
 * links so the subsequence itself can be reconstructed.
 */
function longestIncreasingSubsequence(sequence: number[]): Set<number> {
  const kept = new Set<number>();
  if (sequence.length === 0) return kept;

  const predecessors = new Array<number>(sequence.length); // predecessors[i] = previous position in the subsequence ending at i.
  const tails: number[] = []; // tails[k] = position of the smallest tail value of an increasing subsequence of length k + 1.

  for (let i = 0; i < sequence.length; i++) {
    // Binary search for the first tail whose value is >= sequence[i] (strictly increasing).
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (sequence[tails[mid]] < sequence[i]) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    predecessors[i] = low > 0 ? tails[low - 1] : -1; // The position this one extends, if any.
    if (low === tails.length) {
      tails.push(i); // Extends the longest subsequence found so far.
    } else {
      tails[low] = i; // Improves the tail of an existing length.
    }
  }

  // Walk the predecessor links back from the end of the longest subsequence to collect its positions.
  for (let k = tails[tails.length - 1]; k >= 0; k = predecessors[k]) {
    kept.add(k);
  }
  return kept;
}

/**
 * Find the difference between two arrays of nodes.
 *
 * Nodes are matched by identity. Any node present in both arrays but in a different relative order
 * may need to move; to minimise DOM operations we keep the *longest* run of common nodes that is
 * already in the correct relative order in place (the longest increasing subsequence of their old
 * positions) and only move the rest. Runs in O(n log n).
 *
 * @returns An object containing all updated (and added) nodes as well as all removed nodes in the new children array
 * compared to the old children array.
 */
export function childDiffer(
  oldChildren: ChildElement[],
  newChildren: ChildElement[]
): IChildDiff {
  const newSet = new Set(newChildren);
  const removed = oldChildren.filter(node => !newSet.has(node)); // Nodes no longer present.

  // Map each old node to its index so the new order can be described as a sequence of old positions.
  const oldIndexByNode = new Map(oldChildren.map((node, i) => [node, i]));

  // The nodes common to both states, in their new order, and their corresponding old positions.
  const commonNodes = newChildren.filter(node => oldIndexByNode.has(node));
  const oldPositions = commonNodes.map(node => oldIndexByNode.get(node)!);

  // The common nodes whose old positions form a longest increasing subsequence are already in the
  // correct relative order and can stay put; every other node will be (re)inserted.
  const keptPositions = longestIncreasingSubsequence(oldPositions);
  const keptNodes = new Set<ChildElement>();
  keptPositions.forEach(position => keptNodes.add(commonNodes[position]));

  // Walk the new children from right to left. Each kept node becomes the reference that following
  // (new or moved) nodes are inserted before; nodes after the last kept node are appended (the
  // insertBefore reference starts undefined and is overwritten by each kept node encountered).
  let insertBefore: ChildElement | undefined;
  const updated: INodeUpdate[] = [];
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const node = newChildren[i];
    if (keptNodes.has(node)) {
      insertBefore = node;
    } else {
      updated.push({ node, insertBefore });
    }
  }
  updated.reverse(); // Put the updates back into new-children order.

  return { updated, removed };
}
