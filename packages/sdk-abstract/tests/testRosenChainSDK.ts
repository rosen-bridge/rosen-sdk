import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import AbstractRosenChainSDK from '../lib/abstractRosenChainSDK';

class TestRosenChainSDK extends AbstractRosenChainSDK<never, never, never> {
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

  protected generateLockTransactionCore = this.notImplemented;
}

export default TestRosenChainSDK;
