export type AttributeMetadataDictionary<K extends string> = Partial<Record<K, string>>;
export type AttributeMetadataObject<K extends string, T> = Partial<Record<K, T>>;

function addAttributesToMetadata<K extends string, T>(
  attributeObject: AttributeMetadataObject<K, T>,
  currentAttributeDictionary?: AttributeMetadataDictionary<K>,
): AttributeMetadataDictionary<K> {
  const newAttributeDictionary = Object.keys(attributeObject).reduce((newAttributeDict, key) => {
    newAttributeDict[key] = attributeObject[key] || '';
    return newAttributeDict;
  }, {}) as AttributeMetadataDictionary<K>;

  return {  ...currentAttributeDictionary, ...newAttributeDictionary };
}

function getAttributeFromMetadata<K extends string>(
  name: K,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
): string | '' {
  const firstMatchingAttributeDict = Array.from(attributesMetadata.values()).find(st => Boolean(st[name]));
  return firstMatchingAttributeDict ? firstMatchingAttributeDict[name] as string || '' : '';
}


// tslint:disable-next-line: max-line-length
// TODO: Dictionary needs to take null as possible value as this indicates removal for attributes, will coerce to string for styles.
export function setAttributes<K extends string, T>(
  getAttribute: (name: K) => string,
  setAttribute: (name: K, value: string) => void,
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

    // TODO: Do this check in the setAttribute function?
    if (getAttribute(key) !== value) {
      setAttribute(key, value);
    }
  });
}
