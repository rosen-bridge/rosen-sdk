import { Contract } from 'ethers';

import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { AbstractRosenChainSDK } from '@rosen-bridge/sdk-abstract';
import { NATIVE_TOKEN_IDS, NETWORKS } from '@rosen-bridge/sdk-constant';
import { generateRosenData } from '@rosen-bridge/sdk-utils';
import { TokenMap } from '@rosen-bridge/tokens';

import { transferABI } from './constants';
import { EvmTxType } from './types';

abstract class AbstractRosenEvmChainSDK extends AbstractRosenChainSDK<
  EvmTxType,
  unknown[]
> {
  protected constructor(
    protected tokenMap: TokenMap,
    protected lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  protected generateLockTransactionCore = async (
    tokenId: string,
    toChain: NETWORKS,
    toEncodedAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
  ): Promise<EvmTxType> => {
    let transactionParameters: EvmTxType;
    const rosenData = generateRosenData(
      toChain,
      toEncodedAddress,
      wrappedNetworkFee,
      wrappedBridgeFee,
    );
    if (tokenId === NATIVE_TOKEN_IDS[this.CHAIN]) {
      transactionParameters = {
        to: this.lockAddress,
        data: '0x' + rosenData,
        value: '0x' + unwrappedAmount.toString(16),
        ...(fromAddress && { from: fromAddress }),
      };
    } else {
      const contract = new Contract(tokenId, transferABI, undefined);
      const data = contract.interface.encodeFunctionData('transfer', [
        this.lockAddress,
        unwrappedAmount.toString(),
      ]);

      transactionParameters = {
        to: tokenId,
        data: data + rosenData,
        ...(fromAddress && { from: fromAddress }),
      };
    }
    return transactionParameters;
  };
}

export default AbstractRosenEvmChainSDK;
