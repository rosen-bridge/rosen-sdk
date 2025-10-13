export class UnsupportedTokenException extends Error {
  constructor(tokenId: string) {
    super(`invalid tokenId [${tokenId}] for dogecoin chain`);
  }
}

export class MissingNonWitnessUtxoError extends Error {
  constructor(txId: string, index: number) {
    super(
      `Missing hex data for non-witness UTXO txId: [${txId}], index: [${index}]`,
    );
  }
}
