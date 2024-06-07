import { BoxId, TxId } from "./common";
import { ErgoBoxCandidateProxy } from "./ergoBoxCandidate";
import { ErgoTree } from "./ergoTree";
import { DataInput } from "./input";
import { ContextExtension } from "./prover";
import { Registers } from "./registers";
import { TokenAmountProxy } from "./tokenAmount";

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
