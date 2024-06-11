import { RosenChainToken } from "@rosen-bridge/tokens";
import { IRosenChain } from "../../types/chainTypes";
import { staticImplements } from "../../utils/staticImplements";
import { ErgoBoxProxy } from "../../types/ergo/ergoBox";
import { UnsignedErgoTxProxy } from "../../types/ergo/eip-wallet-api";
import { ErgoRosenSDK } from "./ergoSDK";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";

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
  ): Promise<string | UnsignedErgoTxProxy> {
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
      logger
    );
  }
}
