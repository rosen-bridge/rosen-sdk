import { RosenChainToken } from "@rosen-bridge/tokens";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";

export class BitcoinRosenChain {
  static async getBaseNetworkFee(): Promise<bigint> {
    throw new Error("Not Implemented");
  }

  static generateUnsignedBridgeTx(
    token: RosenChainToken,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined>
      | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>,
    lockAddress: string,
    logger?: AbstractLogger
  ): Promise<string | UnsignedTransaction> {
    throw new Error("Not Implemented");
  }
}
