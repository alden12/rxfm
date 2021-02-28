export type AttributeMetadataDictionary<K extends string> = Partial<Record<K, string | null>>;
export type AttributeMetadataObject<K extends string, T> = Partial<Record<K, T>>;

function addAttributesToMetadata<K extends string, T>(
  attributeObject: AttributeMetadataObject<K, T>,
  currentAttributeDictionary?: AttributeMetadataDictionary<K>,
): AttributeMetadataDictionary<K> {
  const newAttributeDictionary = Object.keys(attributeObject).reduce((newAttributeDict, key) => {
    const attributeValue: T = attributeObject[key];
    newAttributeDict[key] = attributeValue === null ? null : attributeValue || '';
    return newAttributeDict;
  }, {}) as AttributeMetadataDictionary<K>;

  return {  ...currentAttributeDictionary, ...newAttributeDictionary };
}

function getAttributeFromMetadata<K extends string>(
  name: K,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
): string | null {
  const firstMatchingAttributeDict = Array.from(attributesMetadata.values()).find(attributeDict => typeof attributeDict[name] === 'string');
  const firstMatch: string | null | undefined = firstMatchingAttributeDict ? firstMatchingAttributeDict[name] : null;
  return firstMatch === '' ? '' : firstMatch || null;
}

export function setAttributes<K extends string, T>(
  // getAttribute: (name: K) => string | null,
  setAttribute: (name: K, value: string | null) => void,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
  symbol: symbol,
  attributeObject: AttributeMetadataObject<K, T>,
  previousAttributeObject?: AttributeMetadataObject<K, T>,
) {
  const attributeDict = attributesMetadata.get(symbol);

  let attributeObjectWithDeletions = attributeObject;
  if (previousAttributeObject) {
    const previousAttributeObjectNulled: Partial<Record<K, null>> =
      Object.keys(previousAttributeObject).reduce((prevAttributesEmpty, key) => {
        prevAttributesEmpty[key] = null;
        return prevAttributesEmpty;
      }, {} as Partial<Record<K, null>>)

    attributeObjectWithDeletions = { ...previousAttributeObjectNulled, ...attributeObject };
  }

  const newAttributesDict = addAttributesToMetadata(attributeObjectWithDeletions, attributeDict);
  attributesMetadata.set(symbol, newAttributesDict);

  Object.keys(attributeObjectWithDeletions).forEach((key: K) => {
    const value = getAttributeFromMetadata(key, attributesMetadata);
    setAttribute(key, value);
    // if (getAttribute(key) !== value) {
    // }
  });
}
