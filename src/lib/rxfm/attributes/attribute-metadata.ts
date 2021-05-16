import { PartialRecord } from "../utils";

export type AttributeMetadataDictionary<K extends string> = PartialRecord<K, string | null>;
export type AttributeMetadataObject<K extends string, T> = PartialRecord<K, T>;

function addAttributesToMetadata<K extends string, T>(
  attributeObject: AttributeMetadataObject<K, T>,
  currentAttributeDictionary?: AttributeMetadataDictionary<K>,
): AttributeMetadataDictionary<K> {
  const newAttributeDictionary = Object.keys(attributeObject).reduce<AttributeMetadataDictionary<K>>((newAttributeDict, key) => {
    const attributeValue = attributeObject[key as K];
    newAttributeDict[key as K] = typeof attributeValue === 'boolean' ?
      attributeValue ? '' : null :
      attributeValue === null ? null : String(attributeValue);
    return newAttributeDict;
  }, {});

  return {  ...currentAttributeDictionary, ...newAttributeDictionary };
}

function getAttributeFromMetadata<K extends string>(
  name: K,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
): string | null {
  const firstMatchingAttributeDict = Array.from(attributesMetadata.values()).find(attributeDict => typeof attributeDict[name] === 'string');
  const firstMatch: string | null | undefined = firstMatchingAttributeDict ? firstMatchingAttributeDict[name] : null;
  return firstMatch ?? null;
}

export function setAttributes<K extends string, T>(
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
        prevAttributesEmpty[key as K] = null;
        return prevAttributesEmpty;
      }, {} as Partial<Record<K, null>>)

    attributeObjectWithDeletions = { ...previousAttributeObjectNulled, ...attributeObject };
  }

  const newAttributesDict = addAttributesToMetadata(attributeObjectWithDeletions, attributeDict);
  attributesMetadata.set(symbol, newAttributesDict);

  Object.keys(attributeObjectWithDeletions).forEach(key => {
    const value = getAttributeFromMetadata(key as K, attributesMetadata);
    setAttribute(key as K, value);
  });
}
