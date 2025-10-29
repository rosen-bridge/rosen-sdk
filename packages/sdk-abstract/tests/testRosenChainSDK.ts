import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import AbstractRosenChainSDK from '../lib/abstractRosenChainSDK';

class TestRosenChainSDK extends AbstractRosenChainSDK<never, never[]> {
  CHAIN = 'DUMMY_CHAIN' as NETWORKS;

  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  notImplemented = () => {
    throw Error('Not implemented');
  };

  protected generateLockTransactionCore = this.notImplemented;
}

export default TestRosenChainSDK;
