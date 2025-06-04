import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { RosenChainToken } from '@rosen-bridge/tokens';

abstract class AbstractRosenSDK<TxType> {
  protected constructor(protected logger?: AbstractLogger) {
    this.logger = logger || new DummyLogger();
  }

  abstract getBaseNetworkFee: () => Promise<bigint>;
  abstract generateLockTransaction: <UTXOType>(
    token: RosenChainToken,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<UTXOType, undefined>
      | Iterator<UTXOType, undefined>,
    lockAddress: string,
    networkHeight: number,
  ) => Promise<TxType>;
}

export default AbstractRosenSDK;
