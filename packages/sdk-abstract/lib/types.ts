export type UtxoIteratorParams<UTXOType> =
  | AsyncIterator<UTXOType, undefined>
  | Iterator<UTXOType, undefined>;
