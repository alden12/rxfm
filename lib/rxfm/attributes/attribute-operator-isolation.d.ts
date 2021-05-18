import { PartialRecord } from "../utils";
/**
 * A dictionary of attribute (or style) names to attribute string values or null as they will be applied to an element.
 */
export declare type AttributeMetadataDictionary<K extends string> = PartialRecord<K, string | null>;
/**
 * A dictionary of attribute (or style) names to possible input attribute values, which will be converted to strings.
 */
export declare type AttributeMetadataObject<K extends string, T> = PartialRecord<K, T>;
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
export declare function setAttributes<K extends string, T>(setAttribute: (name: K, value: string | null) => void, attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>, symbol: symbol, attributeObject: AttributeMetadataObject<K, T>, previousAttributeObject?: AttributeMetadataObject<K, T>): void;
