import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { AbstractRosenChainSDK, UtxoIteratorParams } from './index';

abstract class AbstractRosenUtxoChainSDK<
  TxType,
  UTXOType,
  NetworkParams,
> extends AbstractRosenChainSDK<
  TxType,
  [UtxoIteratorParams<UTXOType>, NetworkParams]
> {
  abstract CHAIN: NETWORKS;
  protected constructor(
    protected tokenMap: TokenMap,
    protected lockAddress: string,
    protected logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  protected abstract generateLockTransactionCore: (
    tokenId: string,
    toChain: NETWORKS,
    to: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator: UtxoIteratorParams<UTXOType>,
    ...extra: Array<NetworkParams>
  ) => Promise<TxType>;
}

export default AbstractRosenUtxoChainSDK;
