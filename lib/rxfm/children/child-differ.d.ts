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
export declare function childDiffer(oldChildren: ChildElement[], newChildren: ChildElement[]): IChildDiff;
