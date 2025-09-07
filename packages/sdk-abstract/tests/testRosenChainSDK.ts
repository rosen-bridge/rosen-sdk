import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { TokenMap } from '@rosen-bridge/tokens';
import AbstractRosenChainSDK from '../lib/abstractRosenChainSDK';
import { NETWORKS } from '@rosen-bridge/sdk-constant';

class TestRosenChainSDK extends AbstractRosenChainSDK<never, never> {
  CHAIN = 'DUMMY_CHAIN' as NETWORKS;

  constructor(
    protected tokenMap: TokenMap,
    protected lockAddress: string,
    protected logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  notImplemented = () => {
    throw Error('Not implemented');
  };

  getBaseNetworkFee = this.notImplemented;

  protected generateLockTransactionCore = this.notImplemented;
}

export default TestRosenChainSDK;
