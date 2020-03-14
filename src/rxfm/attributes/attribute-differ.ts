import { StringAttributes } from './attributes';

export interface IAttributeDiff {
  updated: StringAttributes;
  removed: string[];
}

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
