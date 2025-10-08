import {
  decode_metadatum_to_json_str,
  GeneralTransactionMetadata,
  MetadataJsonSchema,
} from '@emurgo/cardano-serialization-lib-nodejs';

import JsonBigInt from '@rosen-bridge/json-bigint';

type CardanoMetadata = Record<string, string | Record<string, any>>;

/**
 * Parse a GeneralTransactionMetadata object into a CardanoMetadata object.
 * @param {GeneralTransactionMetadata} metadata - The metadata to be parsed.
 * @returns {CardanoMetadata} - A JSON object with the same keys as the metadata, but with values parsed from JSON strings into JsonBigInt objects.
 */
export const parseMetadata = (
  metadata: GeneralTransactionMetadata,
): CardanoMetadata => {
  const keys = metadata.keys();
  const result: CardanoMetadata = {};
  for (let i = 0; i < keys.len(); i++) {
    const key = keys.get(i);
    result[key.to_str()] = JsonBigInt.parse(
      decode_metadatum_to_json_str(
        metadata.get(key)!,
        MetadataJsonSchema.NoConversions,
      ),
    );
  }
  return result;
};
