import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { TokenMap } from '@rosen-bridge/tokens';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { EmptyTokenMapException } from './errors';

abstract class AbstractRosenChainSDK<TxType, UTXOType> {
  abstract CHAIN: NETWORKS;
  protected constructor(
    protected tokenMap: TokenMap,
    protected lockAddress: string,
    protected logger?: AbstractLogger,
  ) {
    this.logger = logger || new DummyLogger();
  }

  /**
   * wraps values on the CHAIN
   * @param unwrappedValue
   * @param tokenId
   */
  wrapValue = (unwrappedValue: bigint, tokenId: string): bigint => {
    return this.tokenMap.wrapAmount(tokenId, unwrappedValue, this.CHAIN).amount;
  };

  /**
   * generates an unsigned lock transaction on CHAIN
   * @param tokenId
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param unwrappedAmount
   * @param unwrappedBridgeFee
   * @param unwrappedNetworkFee
   * @param utxoIterator
   * @param networkHeight
   */
  generateLockTransaction = async (
    tokenId: string,
    toChain: NETWORKS,
    toAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    unwrappedBridgeFee: bigint,
    unwrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<UTXOType, undefined>
      | Iterator<UTXOType, undefined>,
    networkHeight: number,
  ): Promise<TxType> => {
    if (this.tokenMap.getConfig().length == 0) {
      throw new EmptyTokenMapException();
    }
    const wrappedBridgeFee = this.wrapValue(unwrappedBridgeFee, tokenId);
    const wrappedNetworkFee = this.wrapValue(unwrappedNetworkFee, tokenId);
    return await this.generateLockTransactionCore(
      tokenId,
      toChain,
      toAddress,
      fromAddress,
      unwrappedAmount,
      wrappedBridgeFee,
      wrappedNetworkFee,
      utxoIterator,
      networkHeight,
    );
  };

  protected abstract generateLockTransactionCore: (
    tokenId: string,
    toChain: NETWORKS,
    toAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<UTXOType, undefined>
      | Iterator<UTXOType, undefined>,
    networkHeight: number,
  ) => Promise<TxType>;
}

export default AbstractRosenChainSDK;
