import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { AbstractRosenEvmChainSDK } from '@rosen-bridge/sdk-evm';
import { TokenMap } from '@rosen-bridge/tokens';

class EthereumRosenChainSDK extends AbstractRosenEvmChainSDK {
  CHAIN = NETWORKS.ETHEREUM;
  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }
}

export default EthereumRosenChainSDK;
