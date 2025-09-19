import {
  decode_metadatum_to_json_str,
  GeneralTransactionMetadata,
  MetadataJsonSchema,
} from '@emurgo/cardano-serialization-lib-nodejs';
import JsonBigInt from '@rosen-bridge/json-bigint';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CardanoMetadata = Record<string, string | Record<string, any>>;

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
