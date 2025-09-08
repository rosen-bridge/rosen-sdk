import { DummyLogger } from '@rosen-bridge/abstract-logger';
import {
  cardanoLockAddress,
  ergoLockAddress,
  ethereumLockAddress,
  rosenTokens,
} from './testData';
import { TokenMap } from '@rosen-bridge/tokens';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import TestRosenChainSDK from './testRosenChainSDK';

describe(`TestRosenChainSDK`, () => {
  let tokenMap: TokenMap;
  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();
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
     * - wrapValue should call twice for bridgeFee/networkFee
     * - wrapValue should return correct value with each call for fixed decimals tokens
     * - generateLockTransactionCore should call with correct value specially with wrapped bridgeFee/networkFee
     */
    it(`should throw error when tokenMap is empty or wasn't load correctly`, async () => {
      await tokenMap.updateConfigByJson([]);
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
        new DummyLogger(),
      );
      const x = testRosenChainSDK.generateLockTransaction(
        {} as any, // eslint-disable-line
        NETWORKS.ERGO,
        'address',
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
        [].values(),
        12311000,
      );
      await expect(x).rejects.toThrow('Token map is empty');
    });

    /**
     * @target generateLockTransaction should call abstract function with the correct values for a fixed decimals token
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
    it(`should call abstract function with the correct values for a fixed decimals token`, async () => {
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
      const generateLockTransactionCoreSpy = vi
        .spyOn(
          testRosenChainSDK as any, // eslint-disable-line
          'generateLockTransactionCore',
        )
        .mockResolvedValue({} as any); // eslint-disable-line
      const boxIterator = [].values();

      await testRosenChainSDK.generateLockTransaction(
        rpnDogeTokenIdOnCardano,
        NETWORKS.ERGO,
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
        boxIterator,
        12311000,
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
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledWith(
        rpnDogeTokenIdOnCardano,
        NETWORKS.ERGO,
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        5_000_000_000_000n,
        50_000_000_000n,
        200_000_000n,
        boxIterator,
        12311000,
      );
    });

    /**
     * @target generateLockTransaction should call abstract functions with the correct value, especially when using the wrapped value bridgeFee/networkFee with insignificant toChain decimal correctly
     * @dependencies
     * @scenario
     * - spy on wrapValue
     * - spy on generateLockTransactionCore and mock resolve value to prevent throw error
     * - call generateLockTransaction for rpnETH from ergo to ethereum
     * @expected
     * - wrapValue should call twice for bridgeFee/networkFee
     * - wrapValue should return correct value with each call for bridgeFee/networkFee with insignificant toChain decimal
     * - generateLockTransactionCore should call with correct value specially with wrapped bridgeFee/networkFee
     */
    it(`should call abstract functions with the correct value, especially when using the wrapped value bridgeFee/networkFee with insignificant toChain decimal correctly`, async () => {
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
      const generateLockTransactionCoreSpy = vi
        .spyOn(
          testRosenChainSDK as any, // eslint-disable-line
          'generateLockTransactionCore',
        )
        .mockResolvedValue({} as any); // eslint-disable-line
      const boxIterator = [].values();

      await testRosenChainSDK.generateLockTransaction(
        rpnETHTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa',
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        300_000_000n,
        3_000_000n,
        1_000_000n,
        boxIterator,
        1599000,
      );

      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        1,
        3_000_000n,
        rpnETHTokenIdOnErgo,
      );
      expect(wrapValueSpy).toHaveNthReturnedWith(1, 3_000_000n);
      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        2,
        1_000_000n,
        rpnETHTokenIdOnErgo,
      );
      expect(wrapValueSpy).toHaveNthReturnedWith(2, 1_000_000n);
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledWith(
        rpnETHTokenIdOnErgo,
        NETWORKS.ETHEREUM,
        '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa',
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        300_000_000n,
        3_000_000n,
        1_000_000n,
        boxIterator,
        1599000,
      );
    });

    /**
     * @target generateLockTransaction should call abstract functions with the correct value, especially when using the wrapped value bridgeFee/networkFee with insignificant toChain decimal correctly
     * @dependencies
     * @scenario
     * - spy on wrapValue
     * - spy on generateLockTransactionCore and mock resolve value to prevent throw error
     * - call generateLockTransaction for eth from ethereum to ergo
     * @expected
     * - wrapValue should call twice for bridgeFee/networkFee
     * - wrapValue should return correct value with each call for bridgeFee/networkFee with insignificant fromChain decimal
     * - generateLockTransactionCore should call with correct value specially with wrapped bridgeFee/networkFee
     */
    it(`should call abstract functions with the correct value, especially when using the wrapped value bridgeFee/networkFee with insignificant fromChain decimal correctly`, async () => {
      const testRosenChainSDK = new TestRosenChainSDK(
        tokenMap,
        ethereumLockAddress,
        new DummyLogger(),
      );
      // Ethereum -> Ergo
      testRosenChainSDK['CHAIN'] = NETWORKS.ETHEREUM;
      const ethTokenIdOnEthereum = 'eth';
      const wrapValueSpy = vi.spyOn(testRosenChainSDK, 'wrapValue');
      const generateLockTransactionCoreSpy = vi
        .spyOn(
          testRosenChainSDK as any, // eslint-disable-line
          'generateLockTransactionCore',
        )
        .mockResolvedValue({} as any); // eslint-disable-line
      const boxIterator = [].values();

      await testRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa',
        300_000_000_000_000_000n,
        3_000_000_000_000_000n,
        114_286_000_000_000n,
        boxIterator,
        23232769,
      );

      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        1,
        3_000_000_000_000_000n,
        ethTokenIdOnEthereum,
      );
      expect(wrapValueSpy).toHaveNthReturnedWith(1, 3_000_000n);
      expect(wrapValueSpy).toHaveBeenNthCalledWith(
        2,
        114_286_000_000_000n,
        ethTokenIdOnEthereum,
      );
      expect(wrapValueSpy).toHaveNthReturnedWith(2, 114_286n);
      expect(generateLockTransactionCoreSpy).toHaveBeenCalledWith(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        '9g4Kek6iWspXPAURU3zxT4RGoKvFdvqgxgkANisNFbvDwK1KoxW',
        '0xFBC0dcd6c3518cB529bC1B585dB992A7d40005fa',
        300_000_000_000_000_000n,
        3000_000n,
        114_286n,
        boxIterator,
        23232769,
      );
    });
  });
});
