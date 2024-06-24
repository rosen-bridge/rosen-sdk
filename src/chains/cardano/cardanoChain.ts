import { RosenChainToken } from "@rosen-bridge/tokens";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { CardanoRosenSDK } from "./cardanoSDK";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";

const CARDANO_BASE_NETWORK_FEE: bigint = 3400000n;

export class CardanoRosenChain {
  static async getBaseNetworkFee(): Promise<bigint> {
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
    lockAddress: string,
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
