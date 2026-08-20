export interface UnsignedPsbtData {
  psbt: string;
  psbtHex: string;
  signInputs: Record<string, number[]>;
}

export type NetworkParams = {
  feeRatio: number;
  taprootScriptInfo: Map<string, string>; // address -> internalPubkey
};
