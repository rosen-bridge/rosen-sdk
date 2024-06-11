import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { RosenChainToken } from "@rosen-bridge/tokens";
import { ErgoBoxProxy } from "./ergo/ergoBox";
import { UnsignedErgoTxProxy } from "./ergo/eip-wallet-api";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";

/**
 * IRosenChain
 *
 * Interface defining methods for interaction with a blockchain network in the Rosen bridge.
 */
export interface IRosenChain {
  /**
   * Gets the base network fee for the blockchain network.
   *
   * @returns The base network fee as a bigint.
   */
  getBaseNetworkFee: () => bigint;

  /**
   * Generates an unsigned bridge transaction for transferring tokens to another blockchain network.
   *
   * @param token - The token to be transferred.
   * @param toChain - The destination blockchain network.
   * @param toAddress - The address on the destination blockchain to receive the tokens.
   * @param changeAddress - The address to receive the change on the source blockchain.
   * @param amount - The amount of the token to be transferred.
   * @param bridgeFee - The fee for using the bridge.
   * @param networkFee - The network fee for the transaction.
   * @param utxoIterator - An iterator over UTXOs (unspent transaction outputs) from the source blockchain.
   * @param lockAddress - The address where the tokens will be locked on the source blockchain.
   * @param logger - Abstract logger for logging purposes
   * @returns A promise that resolves to a string or an UnsignedErgoTxProxy representing the unsigned transaction.
   */
  generateUnsignedBridgeTx: (
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
  ) => Promise<string | UnsignedErgoTxProxy>;
}

/**
 * IRosenSDK
 *
 * Interface defining methods for generating lock transactions in the Rosen bridge.
 */
export interface IRosenSDK {
  /**
   * Generates a lock transaction for transferring tokens to another blockchain network.
   *
   * @param token - The token to be transferred.
   * @param toChain - The destination blockchain network.
   * @param toAddress - The address on the destination blockchain to receive the tokens.
   * @param changeAddressHex - The address to receive the change on the source blockchain, in hexadecimal format.
   * @param amount - The amount of the token to be transferred.
   * @param bridgeFee - The fee for using the bridge.
   * @param networkFee - The network fee for the transaction.
   * @param utxoIterator - An iterator over UTXOs (unspent transaction outputs) from the source blockchain.
   * @param lockAddress - The address where the tokens will be locked on the source blockchain.
   * @param logger - Abstract logger for logging purposes
   * @returns A promise that resolves to a string or an UnsignedErgoTxProxy representing the unsigned lock transaction.
   */
  generateLockTransaction(
    token: RosenChainToken,
    toChain: string,
    toAddress: string,
    changeAddressHex: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<CardanoUtxo | ErgoBoxProxy, undefined>
      | Iterator<CardanoUtxo | ErgoBoxProxy, undefined>,
    lockAddress: string,
    logger?: AbstractLogger
  ): Promise<string | UnsignedErgoTxProxy>;
}
