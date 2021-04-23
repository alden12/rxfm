import { PartialRecord } from "../utils";
export declare type AttributeMetadataDictionary<K extends string> = PartialRecord<K, string | null>;
export declare type AttributeMetadataObject<K extends string, T> = PartialRecord<K, T>;
export declare function setAttributes<K extends string, T>(setAttribute: (name: K, value: string | null) => void, attributesMetadata: Map<symbol, AttributeMetadataDictionary<K>>, symbol: symbol, attributeObject: AttributeMetadataObject<K, T>, previousAttributeObject?: AttributeMetadataObject<K, T>): void;
