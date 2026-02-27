import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { AbstractRosenEvmChainSDK } from '../lib';

class TestRosenChainSDK extends AbstractRosenEvmChainSDK {
  CHAIN = NETWORKS.ETHEREUM;

  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }
}

export default TestRosenChainSDK;
