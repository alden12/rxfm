import { StringAttributes } from './attributes';

/**
 * An interface to describe the difference between two states of an HTML elements attributes.
 */
export interface IAttributeDiff {
  /**
   * The updated (or added) attributes.
   */
  updated: StringAttributes;
  /**
   * The removed attributes.
   */
  removed: string[];
}

/**
 * Find the difference between two states of an HTML elements attributes and return the updated (or added) and removed
 * attributes.
 */
export function attributeDiffer(
  oldAttributes: StringAttributes,
  newAttributes: StringAttributes
): IAttributeDiff {
  const updated = Object.keys(newAttributes).reduce(
    (updates, key) => {
      if (newAttributes[key] && oldAttributes[key] !== newAttributes[key]) {
        updates[key] = newAttributes[key];
      }
      return updates;
    },
    {} as StringAttributes
  );

  const removed = Object.keys(oldAttributes).filter(key => !newAttributes[key]);

  return { updated, removed };
}
