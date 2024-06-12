import { ErgoBoxCandidate } from "ergo-lib-wasm-nodejs";

export class ErgoRosenSDK {
  /**
   * Creates a lock box with Rosen Tx Structure
   * - `toChain`: _string_, the target blockchain
   * - `toAddress`: _string_, the destination address in the target blockchain
   * - `networkFee`: _string_, the amount of network fee for this transfer
   * - `bridgeFee`: _string_, the amount of bridge fee for this transfer
   * - `fromAddress`: _string_, the address that is requesting the transfer
   * @param lockAddress
   * @param height
   * @param tokenId
   * @param amount
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param bridgeFee
   * @param networkFee
   */
  static createLockBox(
    lockAddress: string,
    height: number,
    tokenId: string,
    amount: bigint,
    toChain: string,
    toAddress: string,
    fromAddress: string,
    bridgeFee: bigint,
    networkFee: bigint
  ): ErgoBoxCandidate {
    throw new Error("Not Implemented");
  }

  /**
   * generates an unsigned lock transaction on Ergo
   * @param changeAddress
   * @param lockAddress
   * @param utxoIterator
   * @param toChain
   * @param toAddress
   * @param tokenId
   * @param amount
   * @param bridgeFee
   * @param networkFee
   */
  static generateUnsignedTx(
    changeAddress: string,
    lockAddress: string,
    utxoIterator: AsyncIterator<undefined> | Iterator<undefined>,
    toChain: string,
    toAddress: string,
    tokenId: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint
  ): Promise<string> {
    throw new Error("Not Implemented");
  }
}
