import { CardanoProtocolParams, CardanoUtxo } from "../../types/cardanoTypes";

export class CardanoRosenSDK {
  /**
   * generates metadata for lock transaction
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param networkFee
   * @param bridgeFee
   */
  generateLockAuxiliaryData(
    toChain: string,
    toAddress: string,
    fromAddress: string,
    networkFee: string,
    bridgeFee: string
  ): Promise<string> {
    throw new Error("Not Implemented");
  }

  /**
   * generates a lock transaction on Cardano
   * @param protocolParams The Cardano protocol params
   * @param utxoIterator an Iterator object that is used to fetch input utxos
   * @param lockAddress
   * @param changeAddress
   * @param policyIdHex transferring asset policy ID (empty string in case of ADA transfer)
   * @param assetNameHex transferring asset name in hex
   * @param amount
   * @param auxiliaryDataHex
   * @returns hex representation of the unsigned tx
   */
  async generateLockTransaction(
    changeAddress: string,
    lockAddress: string,
    protocolParams: CardanoProtocolParams,
    utxoIterator:
      | AsyncIterator<CardanoUtxo, undefined>
      | Iterator<CardanoUtxo, undefined>,
    policyIdHex: string,
    assetNameHex: string,
    amountString: string,
    auxiliaryDataHex: string
  ): Promise<string> {
    throw new Error("Not Implemented");
  }
}
