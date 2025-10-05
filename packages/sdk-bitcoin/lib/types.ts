export interface UnsignedPsbtData {
  psbt: {
    base64: string;
    hex: string;
  };
  inputSize: number;
}

export type NetworkParams = {
  feeRatio: number;
};
