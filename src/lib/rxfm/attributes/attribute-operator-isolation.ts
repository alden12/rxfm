import { PartialRecord } from "../utils";

/**
 * A dictionary of attribute (or style) names to attribute string values or null as they will be applied to an element.
 */
export type AttributeMetadataDictionary<K extends string> = PartialRecord<K, string | null>;

/**
 * A dictionary of attribute (or style) names to possible input attribute values, which will be converted to strings.
 */
export type AttributeMetadataObject<K extends string, T> = PartialRecord<K, T>;

/**
 * Add new attributes to the current attributes metadata.
 * @param attributeObject The new attribute object to add containing attribute keys and allowed attribute value types.
 * @param currentAttributeDictionary The dictionary of attributes currently active for the given attributes operator.
 * @returns The new attributes dictionary after the new attribute object is added.
 */
function addAttributesToMetadata<K extends string, T>(
  attributeObject: AttributeMetadataObject<K, T>,
  currentAttributeDictionary?: AttributeMetadataDictionary<K>,
): AttributeMetadataDictionary<K> {
  const newAttributeDictionary = Object.keys(attributeObject).reduce<AttributeMetadataDictionary<K>>((newAttributeDict, key) => {
    const attributeValue = attributeObject[key as K];
    // Coerce attributes to be either string or null.
    newAttributeDict[key as K] = typeof attributeValue === 'boolean' ?
      attributeValue ? '' : null :
      attributeValue === null ? null : String(attributeValue);
    return newAttributeDict;
  }, {});

  return {  ...currentAttributeDictionary, ...newAttributeDictionary };
}

/**
 * Get the currently active value of an attribute from an attribute metadata map.
 * @param name The name of the attribute.
 * @param attributesMetadata The current attributes metadata map containing an attribute dictionary for each attributes
 * operator on an element.
 */
function getAttributeFromMetadata<K extends string>(
  name: K,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
): string | null {
  // Find the dictionary for the operator with hightest priority containing the attribute name.
  // NOTE: This will mean there is no way to enforce removal of an attribute if it is enabled on an operator with lower priority.
  const firstMatchingAttributeDict = Array.from(attributesMetadata.values()).find(attributeDict => typeof attributeDict[name] === 'string');
  return firstMatchingAttributeDict ? firstMatchingAttributeDict[name]! : null; // Return the attribute value or null.
}

/**
 * Set an attribute on an element without conflicting with any other attribute operators which may be present on the element.
 * @param setAttribute A function taking the attribute name and value and setting the attribute on the element.
 * @param attributesMetadata The current attributes metadata map containing an attribute dictionary for each attributes
 * operator on the element.
 * @param symbol The symbol representing this attributes operator.
 * @param attributeObject The attribute metadata object containing names and values of attributes which are desired to be set by
 * an attributes operator.
 * @param previousAttributeObject The previous attribute metadata object. If provided this will be used to find which attributes
 * have been removed in the new attribute object.
 */
export function setAttributes<K extends string, T>(
  setAttribute: (name: K, value: string | null) => void,
  attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>,
  symbol: symbol,
  attributeObject: AttributeMetadataObject<K, T>,
  previousAttributeObject?: AttributeMetadataObject<K, T>,
) {
  const attributeDict = attributesMetadata.get(symbol);

  // If a previous attribute object is provided, construct an attributes object with null values for any removed keys.
  let attributeObjectWithDeletions = attributeObject;
  if (previousAttributeObject) {
    const previousAttributeObjectNulled: Partial<Record<K, null>> =
      Object.keys(previousAttributeObject).reduce((prevAttributesEmpty, key) => {
        prevAttributesEmpty[key as K] = null;
        return prevAttributesEmpty;
      }, {} as Partial<Record<K, null>>)
    // Merge the previous attributes object with null keys with the one, any removed keys will now have null values.
    attributeObjectWithDeletions = { ...previousAttributeObjectNulled, ...attributeObject };
  }

  // Get the new attributes dictionary and set it to the metadata map.
  const newAttributesDict = addAttributesToMetadata(attributeObjectWithDeletions, attributeDict);
  attributesMetadata.set(symbol, newAttributesDict);

  // Loop through attribute changes and set the new values for each attribute.
  Object.keys(attributeObjectWithDeletions).forEach(key => {
    // Get the value for the attribute key with the highest priority.
    const value = getAttributeFromMetadata(key as K, attributesMetadata);
    setAttribute(key as K, value);
  });
}
