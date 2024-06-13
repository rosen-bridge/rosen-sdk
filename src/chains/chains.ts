import { RosenChainToken } from "@rosen-bridge/tokens";
import { Networks } from "../constants/constants";
import { ChainNotSupportedException } from "../errors";
import { BitcoinRosenChain } from "./bitcoin/bitcoinChain";
import { CardanoRosenChain } from "./cardano/cardanoChain";
import { ErgoRosenChain } from "./ergo/ergoChain";
import { ErgoBoxProxy } from "../types/ergo/ergoBox";
import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { UnsignedTransaction } from "ergo-lib-wasm-nodejs";

/**
 * RosenChains
 *
 * This class provides methods to interact with different blockchain networks supported by Rosen.
 * It acts as a simplified and organized way for SDK users to retrieve the required elements for
 * bridging.
 */
export class RosenChains {
  /**
   * Gets the base network fee for a given blockchain network.
   *
   * @param chain - The name of the blockchain network.
   * @returns The base network fee as a bigint.
   * @throws ChainNotSupportedException if the blockchain network is not supported.
   */
  static getBaseNetworkFee(chain: keyof typeof Networks): bigint {
    switch (chain) {
      case Networks.ergo:
        return ErgoRosenChain.getBaseNetworkFee();
      case Networks.cardano:
        return CardanoRosenChain.getBaseNetworkFee();
      case Networks.bitcoin:
        return BitcoinRosenChain.getBaseNetworkFee();
      default:
        throw new ChainNotSupportedException();
    }
  }

  /**
   * Generates an unsigned bridge transaction for transferring tokens from one blockchain network to another.
   *
   * @param fromChain - The source blockchain network.
   * @param toChain - The destination blockchain network.
   * @param toAddress - The address on the destination blockchain to receive the tokens.
   * @param changeAddress - The address to receive the change on the source blockchain.
   * @param token - The token to be transferred.
   * @param amount - The amount of the token to be transferred.
   * @param bridgeFee - The fee for using the bridge.
   * @param networkFee - The network fee for the transaction.
   * @param utxoIterator - An iterator over UTXOs (unspent transaction outputs) from the source blockchain.
   * @returns A promise that resolves to a string or an UnsignedErgoTxProxy representing the unsigned transaction.
   * @throws ChainNotSupportedException if the source blockchain network is not supported.
   */
  static async generateUnsignedBridgeTx(
    fromChain: keyof typeof Networks,
    toChain: keyof typeof Networks,
    toAddress: string,
    changeAddress: string,
    token: RosenChainToken,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined>
      | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>
  ): Promise<string | UnsignedTransaction> {
    switch (fromChain) {
      case Networks.ergo:
        return await ErgoRosenChain.generateUnsignedBridgeTx(
          token,
          toChain,
          toAddress,
          changeAddress,
          amount,
          bridgeFee,
          networkFee,
          utxoIterator
        );
      case Networks.cardano:
        return await CardanoRosenChain.generateUnsignedBridgeTx(
          token,
          toChain,
          toAddress,
          changeAddress,
          amount,
          bridgeFee,
          networkFee,
          utxoIterator
        );
      case Networks.cardano:
        return await BitcoinRosenChain.generateUnsignedBridgeTx(
          token,
          toChain,
          toAddress,
          changeAddress,
          amount,
          bridgeFee,
          networkFee,
          utxoIterator
        );
      default:
        throw new ChainNotSupportedException();
    }
  }
}
