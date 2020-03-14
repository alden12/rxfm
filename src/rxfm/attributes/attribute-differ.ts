import { Attributes } from './attributes';

export interface IAttributeDiff {
  updated: Attributes;
  removed: string[];
}

export function attributeDiffer(
  oldAttributes: Attributes,
  newAttributes: Attributes
): IAttributeDiff {
  const updated = Object.keys(newAttributes).reduce(
    (updates, key) => {
      if (newAttributes[key] && oldAttributes[key] !== newAttributes[key]) {
        updates[key] = newAttributes[key];
      }
      return updates;
    },
    {} as Attributes
  );

  const removed = Object.keys(oldAttributes).filter(key => !newAttributes[key]);

  return { updated, removed };
}
