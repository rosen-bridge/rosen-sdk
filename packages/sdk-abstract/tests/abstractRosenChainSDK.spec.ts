import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { EmptyTokenMapException } from '../lib';
import {
  cardanoLockAddress,
  ergoLockAddress,
  ethereumLockAddress,
  rosenTokens,
} from './testData';
import TestRosenChainSDK from './testRosenChainSDK';

describe(`TestRosenChainSDK`, () => {
  let tokenMap: TokenMap;
  beforeEach(async () => {
    tokenMap = new TokenMap();
    await tokenMap.updateConfigByJson(rosenTokens);
  });

  describe(`generateLockTransaction`, () => {
    /**
     * @target generateLockTransaction should throw error when tokenMap is empty
     * @dependencies
     * @scenario
     * - update tokenMap to empty config
     * - call generateLockTransaction while token map is empty
     * @expected
     * - throw error EmptyTokenMapException
     */
    it(`should throw error when tokenMap is empty`, async () => {
      await tokenMap.updateConfigByJson([]);
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
        new DummyLogger(),
      );
      const unsignedTx = testRosenChainSDK.generateLockTransaction(
        {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        NETWORKS.ERGO,
        'to_address',
        'from_address',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
      );
      await expect(unsignedTx).rejects.toThrow(EmptyTokenMapException);
    });

    /**
     * @target generateLockTransaction should have been called abstract function with the correct values for a fixed decimals token
     * @dependencies
     * @scenario
     * - spy on wrapValue
     * - spy on generateLockTransactionCore and mock resolve value to prevent throw error
     * - call generateLockTransaction for rpnDoge from cardano to ergo
     * - check if functions got called
     * @expected
     * - wrapValue should have been called twice (for bridgeFee and networkFee)
     * - generateLockTransactionCore should have been called with the same bridgeFee and networkFee
     */
    it(`should have been called abstract function with the correct values for a fixed decimals token`, async () => {
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
        new DummyLogger(),
      );
      // Cardano -> Ergo
      testRosenChainSDK['CHAIN'] = NETWORKS.CARDANO;
      const rpnDogeTokenIdOnCardano =
        '92210c500a405bc2c2b6c9666fe74cb4f2ac26251968e3e779887b63.72706e446f6765';

      const wrapValueSpy = vi.spyOn(testRosenChainSDK, 'wrapValue');
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const generateLockTransactionCoreSpy = vi
        .spyOn(testRosenChainSDK as any, 'generateLockTransactionCore')
        .mockResolvedValue({} as any);

      await testRosenChainSDK.generateLockTransaction(
        rpnDogeTokenIdOnCardano,
        NETWORKS.ERGO,
        'to_address',
        'from_address',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
      );

      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        1,
        50_000_000_000n,
        rpnDogeTokenIdOnCardano,
      );
      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        2,
        200_000_000n,
        rpnDogeTokenIdOnCardano,
      );
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledExactlyOnceWith(
        rpnDogeTokenIdOnCardano,
        NETWORKS.ERGO,
        'to_address',
        'from_address',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
      );
    });

    /**
     * @target generateLockTransaction should have been called abstract function with the correct values for a multi decimals token with insignificant decimals on toChain
     * @dependencies
     * @scenario
     * - spy on wrapValue
     * - spy on generateLockTransactionCore and mock resolve value to prevent throw error
     * - call generateLockTransaction for rpnETH from ergo to ethereum
     * @expected
     * - wrapValue should have been called twice for bridgeFee/networkFee
     * - wrapValue should return correct value with each call for bridgeFee/networkFee with insignificant toChain decimal
     * - generateLockTransactionCore should have been called with correct value specially with wrapped bridgeFee/networkFee
     */
    it(`should have been called abstract function with the correct values for a multi decimals token with insignificant decimals on toChain`, async () => {
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        ergoLockAddress,
        new DummyLogger(),
      );
      // Ergo -> Ethereum
      testRosenChainSDK['CHAIN'] = NETWORKS.ERGO;
      const rpnETHTokenIdOnErgo =
        '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1';
      const wrapValueSpy = vi.spyOn(testRosenChainSDK, 'wrapValue');
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const generateLockTransactionCoreSpy = vi
        .spyOn(testRosenChainSDK as any, 'generateLockTransactionCore')
        .mockResolvedValue({} as any);

      await testRosenChainSDK.generateLockTransaction(
        rpnETHTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        'to_address',
        'from_address',
        300_000_000n,
        3_000_000n,
        1_000_000n,
      );

      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        1,
        3_000_000n,
        rpnETHTokenIdOnErgo,
      );
      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        2,
        1_000_000n,
        rpnETHTokenIdOnErgo,
      );
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledExactlyOnceWith(
        rpnETHTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        'to_address',
        'from_address',
        300_000_000n,
        3_000_000n,
        1_000_000n,
      );
    });

    /**
     * @target generateLockTransaction should have been called abstract functions with the correct value, for a wrapped value bridgeFee/networkFee with insignificant toChain decimal correctly
     * @dependencies
     * @scenario
     * - spy on wrapValue
     * - spy on generateLockTransactionCore and mock resolve value to prevent throw error
     * - call generateLockTransaction for eth from ethereum to ergo
     * @expected
     * - wrapValue should have been called twice for bridgeFee/networkFee
     * - wrapValue should return correct value with each call for bridgeFee/networkFee with insignificant fromChain decimal
     * - generateLockTransactionCore should have been called with correct value specially with wrapped bridgeFee/networkFee
     */
    it(`should have been called abstract functions with the correct value, for a wrapped value bridgeFee/networkFee with insignificant fromChain decimal correctly`, async () => {
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        ethereumLockAddress,
        new DummyLogger(),
      );
      // Ethereum -> Ergo
      testRosenChainSDK['CHAIN'] = NETWORKS.ETHEREUM;
      const ethTokenIdOnEthereum = 'eth';
      const wrapValueSpy = vi.spyOn(testRosenChainSDK, 'wrapValue');
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const generateLockTransactionCoreSpy = vi
        .spyOn(testRosenChainSDK as any, 'generateLockTransactionCore')
        .mockResolvedValue({} as any);

      await testRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        'to_address',
        'from_address',
        300_000_000_000_000_000n,
        3_000_000_000_000_000n,
        114_286_000_000_000n,
      );

      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        1,
        3_000_000_000_000_000n,
        ethTokenIdOnEthereum,
      );
      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        2,
        114_286_000_000_000n,
        ethTokenIdOnEthereum,
      );
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledExactlyOnceWith(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        'to_address',
        'from_address',
        300_000_000_000_000_000n,
        3000_000n,
        114_286n,
      );
    });
  });
});
