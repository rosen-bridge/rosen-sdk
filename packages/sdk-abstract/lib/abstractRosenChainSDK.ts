import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { EmptyTokenMapException } from './errors';

abstract class AbstractRosenChainSDK<TxType, UTXOType, NetworkParams> {
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
   * @param to destination address (it may be the address itself or an encoding version of it) Please refer to the child chain for exact encoding
   * @param fromAddress
   * @param unwrappedAmount
   * @param unwrappedBridgeFee
   * @param unwrappedNetworkFee
   * @param utxoIterator
   * @param extra
   */
  generateLockTransaction = async (
    tokenId: string,
    toChain: NETWORKS,
    to: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    unwrappedBridgeFee: bigint,
    unwrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<UTXOType, undefined>
      | Iterator<UTXOType, undefined>,
    ...extra: Array<NetworkParams>
  ): Promise<TxType> => {
    if (this.tokenMap.getConfig().length == 0) {
      throw new EmptyTokenMapException();
    }
    const wrappedBridgeFee = this.wrapValue(unwrappedBridgeFee, tokenId);
    const wrappedNetworkFee = this.wrapValue(unwrappedNetworkFee, tokenId);
    return await this.generateLockTransactionCore(
      tokenId,
      toChain,
      to,
      fromAddress,
      unwrappedAmount,
      wrappedBridgeFee,
      wrappedNetworkFee,
      utxoIterator,
      ...extra,
    );
  };

  protected abstract generateLockTransactionCore: (
    tokenId: string,
    toChain: NETWORKS,
    to: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<UTXOType, undefined>
      | Iterator<UTXOType, undefined>,
    ...extra: Array<NetworkParams>
  ) => Promise<TxType>;
}

export default AbstractRosenChainSDK;
