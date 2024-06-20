import { RosenChainToken } from "@rosen-bridge/tokens";
import { ErgoRosenSDK } from "./ergoSDK";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";

const ERGO_BASE_NETWORK_FEE: bigint = 1300000n;

export class ErgoRosenChain {
  static async getBaseNetworkFee(): Promise<bigint> {
    return ERGO_BASE_NETWORK_FEE;
  }
  static async generateUnsignedBridgeTx(
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
    return await ErgoRosenSDK.generateLockTransaction(
      token,
      toChain,
      toAddress,
      changeAddress,
      amount,
      bridgeFee,
      networkFee,
      utxoIterator as Iterator<ErgoBoxProxy, undefined>,
      lockAddress,
      -1,
      logger
    );
  }
}
