import { RosenChainToken } from "@rosen-bridge/tokens";
import { staticImplements } from "../../utils/staticImplements";
import { ErgoRosenSDK } from "./ergoSDK";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";
import { IRosenChain } from "../types/chainTypes";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";

const ERGO_BASE_NETWORK_FEE: bigint = 1300000n;

@staticImplements<IRosenChain>()
export class ErgoRosenChain {
  static getBaseNetworkFee(): bigint {
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
    lockAddress: string = LOCK_ADDRESSES.ergo,
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
