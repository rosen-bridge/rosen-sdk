import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { EmptyTokenMapException } from './errors';

abstract class AbstractRosenChainSDK<
  TxType,
  ExtraNetworkParams extends unknown[],
> {
  abstract CHAIN: NETWORKS;
  protected logger: AbstractLogger;
  protected constructor(
    protected tokenMap: TokenMap,
    protected lockAddress: string,
    logger?: AbstractLogger,
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
    ...extra: ExtraNetworkParams
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
    ...extra: ExtraNetworkParams
  ) => Promise<TxType>;
}

export default AbstractRosenChainSDK;
