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
 * Find the difference between two arrays of nodes.
 * @returns An object containing all updated (and added) nodes as well as all removed nodes in the new children array
 * compared to the old children array.
 */
export function childDiffer(
  oldChildren: ChildElement[],
  newChildren: ChildElement[]
): IChildDiff {
  const oldSet = new Set(oldChildren); // Create sets of both new and old children.
  const newSet = new Set(newChildren);

  // Find the common nodes between the old and new children, ordered as they are in both the new and old arrays.
  const remainingOldOrder = oldChildren.filter(node => newSet.has(node));
  const remainingNewOrder = newChildren.filter(node => oldSet.has(node));

  // Find if the common nodes have not changed order between the new and old arrays.
  const orderUnchanged = remainingNewOrder.every(
    (node, i) => remainingOldOrder[i] === node
  );

  let unchangedNodes: Set<ChildElement>; // Create a set of all nodes which are common and have not changed order.
  if (orderUnchanged) {
    unchangedNodes = new Set(remainingNewOrder); // If order has not changed, create set from common nodes.

  } else { // Otherwise find nodes whose order has not changed.
    const oldNodeAndNext = new Map( // Create a map of each common node to its next common node in the old order.
      remainingOldOrder.map((node, i) => [node, remainingOldOrder[i + 1]])
    );
    const newElementsAndIndex = new Map( // Create a map of each common node to its index in the new order.
      remainingNewOrder.map((node, i) => [node, i])
    );

    const reordered = new Set( // Create a set of all common nodes which have changed order.
      remainingNewOrder.filter((node, i) => {
        const oldNext = oldNodeAndNext.get(node); // Get the node which used to follow this one in the old order.
        const newIndexOfNext = (oldNext && newElementsAndIndex.get(oldNext)) || Infinity; // Find the new index of that node.
        return newIndexOfNext < i; // Node is reordered if the old next element now comes before this element.
      })
    );

    unchangedNodes = new Set( // Unchanged nodes is inverse of reordered nodes.
      remainingNewOrder.filter(node => !reordered.has(node))
    );
  }

  // Create an array of node updates (an update is a node and the node to insert it before if applicable).
  let insertBefore: ChildElement | undefined;
  const updated: INodeUpdate[] = [];
  for (let i = newChildren.length - 1; i >= 0; i--) { // Loop through the new nodes in reverse order
    const node = newChildren[i];
    if (unchangedNodes.has(node)) { // If the current node already existed and has not changed order:
      // Any future nodes should be inserted before this one so store as the current insert before reference. This will
      // start as undefined so if no unchanged nodes have yet been passed then nodes will be inserted at the end, this
      // value will be overwritten by any future unchanged nodes.
      insertBefore = node;
    } else { // If this is a new node or has changed order:
      updated.push({ node, insertBefore }); // Add to the updated array along with the node to insert before if present.
    }
  }
  updated.reverse(); // Reverse the updated array to put it in the correct order of the new nodes.

  const removed = oldChildren.filter(child => !newSet.has(child)); // Find any nodes which have been removed.

  return { updated, removed };
}
