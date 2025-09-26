export type BoxId = HexString;
export type TxId = HexString;
export type HexString = string;
export type TokenId = HexString;

export type ErgoBoxProxy = {
  readonly boxId: BoxId;
  readonly transactionId: TxId;
  readonly index: number;
  readonly ergoTree: ErgoTree;
  readonly creationHeight: number;
  readonly value: string;
  readonly assets: TokenAmountProxy[];
  readonly additionalRegisters: Registers;
};

export declare type ErgoBoxCandidateProxy = {
  readonly value: string;
  readonly ergoTree: ErgoTree;
  readonly creationHeight: number;
  readonly assets: TokenAmountProxy[];
  readonly additionalRegisters: Registers;
};

export type ErgoTree = HexString;

export type ErgoTxProxy = {
  readonly id: TxId;
  readonly inputs: Input[];
  readonly dataInputs: DataInput[];
  readonly outputs: ErgoBoxProxy[];
  readonly size: number;
};

export type Input = {
  readonly boxId: BoxId;
  readonly spendingProof: ProverResult;
};

export type DataInput = {
  readonly boxId: BoxId;
};

export type ContextExtension = {
  [key: string]: HexString;
};

export type ProverResult = {
  readonly proof: Uint8Array;
  readonly extension: ContextExtension;
};

export type Registers = {
  [key: string]: HexString;
};

export type TokenAmountProxy = {
  readonly tokenId: TokenId;
  readonly amount: string;
  readonly name?: string;
  readonly decimals?: number;
};

export type UnsignedInputProxy = {
  readonly boxId: BoxId;
  readonly transactionId: TxId;
  readonly index: number;
  readonly ergoTree: ErgoTree;
  readonly creationHeight: number;
  readonly value: string;
  readonly assets: TokenAmountProxy[];
  readonly additionalRegisters: Registers;
  readonly extension: ContextExtension;
};

export type UnsignedErgoTxProxy = {
  readonly inputs: UnsignedInputProxy[];
  readonly dataInputs: DataInput[];
  readonly outputs: ErgoBoxCandidateProxy[];
};

export type UnsignedGenerateTxProxy = {
  readonly unsignedTxProxy: UnsignedErgoTxProxy;
  readonly inputsSigmaBytes: string[];
  readonly dataInputsSigmaBytes: string[];
};

export type NetworkParams = {
  networkHeight: number;
};
