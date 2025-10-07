export interface UnsignedPsbtData {
  psbt: {
    base64: string;
    hex: string;
  };
  inputSize: number;
}

export type NetworkParams = {
  feeRatio: number;
  txToHex: Record<string, string>;
};

export interface DogecoinUtxo {
  txId: string;
  index: number;
  value: bigint;
}
