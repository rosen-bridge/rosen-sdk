import { RosenChainToken } from "@rosen-bridge/tokens";
import { staticImplements } from "../../utils/staticImplements";
import { ErgoBoxProxy } from "../../types/ergo/ergoBox";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";
import { IRosenChain } from "../types/chainTypes";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";

@staticImplements<IRosenChain>()
export class BitcoinRosenChain {
  static getBaseNetworkFee(): bigint {
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
    lockAddress: string = LOCK_ADDRESSES.bitcoin,
    logger?: AbstractLogger
  ): Promise<string | UnsignedTransaction> {
    throw new Error("Not Implemented");
  }
}
