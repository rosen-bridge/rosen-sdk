import { RosenChainToken } from "@rosen-bridge/tokens";
import { staticImplements } from "../../utils/staticImplements";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { CardanoRosenSDK } from "./cardanoSDK";
import { ErgoBoxProxy } from "../../types/ergo/ergoBox";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";
import { IRosenChain } from "../types/chainTypes";

const CARDANO_BASE_NETWORK_FEE: bigint = 3400000n;

@staticImplements<IRosenChain>()
export class CardanoRosenChain {
  static getBaseNetworkFee(): bigint {
    return CARDANO_BASE_NETWORK_FEE;
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
    lockAddress: string = LOCK_ADDRESSES.cardano,
    logger?: AbstractLogger
  ): Promise<string> {
    return await CardanoRosenSDK.generateLockTransaction(
      token,
      toChain,
      toAddress,
      changeAddress,
      amount,
      bridgeFee,
      networkFee,
      utxoIterator as Iterator<CardanoUtxo, undefined>,
      lockAddress,
      logger
    );
  }
}
