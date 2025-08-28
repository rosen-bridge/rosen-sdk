import { DummyLogger } from '@rosen-bridge/abstract-logger';
import { ErgoNetworkType } from '@rosen-bridge/minimum-fee';
import { TokenNotFoundException, ChainNotSupportedException } from '../lib';
import RosenUserInterface from '../lib/rosenUserInterface';
import {
  tokenMap,
  testChains,
  ergToCardanoFeeSample,
  ethToErgoFeeSample,
  ethToEthereumFeeSample,
  expectedErgTokenSet,
  rsnFeeSample,
  ergToErgoFeeSample,
} from './testData';
import { mockGetMinimumFeeBox, resetMocks } from './mocked/minimumFee.mock';

describe(`RosenUserInterface`, () => {
  let rosenUserInterface: RosenUserInterface;

  beforeEach(async () => {
    // Reset static instance and mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (RosenUserInterface as any).instance = undefined;
    resetMocks();

    // Initialize RosenUserInterface with test data
    await RosenUserInterface.initialize(
      tokenMap,
      'min-fee-nft-test',
      'explorer' as ErgoNetworkType,
      'https://explorer.com',
      new DummyLogger(),
    );
    rosenUserInterface = RosenUserInterface.getInstance();
  });

  describe(`getAvailableChainsForToken`, () => {
    /**
     * @target getAvailableChainsForToken should throw
     * TokenNotFoundException when token is not found
     * @dependencies
     * - TokenMap
     * @scenario
     * - call getAvailableChainsForToken with non-existent token
     * - check if TokenNotFoundException is thrown
     * @expected
     * - it should throw TokenNotFoundException with correct error message
     */
    it(`should throw TokenNotFoundException when token is not found`, () => {
      // call getAvailableChainsForToken with non-existent token
      expect(() => {
        rosenUserInterface.getAvailableChainsForToken(
          'ergo',
          'non-existent-token',
        );
      }).toThrow(TokenNotFoundException);
    });

    /**
     * @target getAvailableChainsForToken should return
     * available chains when token is found
     * @dependencies
     * - TokenMap
     * @scenario
     * - call getAvailableChainsForToken with existing token
     * - check returned value
     * @expected
     * - it should return list of available chains
     */
    it(`should return available chains when token is found`, () => {
      // call getAvailableChainsForToken with existing token
      const result = rosenUserInterface.getAvailableChainsForToken(
        'ergo',
        'erg',
      );

      // check returned value
      expect(result).toEqual(testChains);
    });
  });

  describe(`getTokenDetails`, () => {
    /**
     * @target getTokenDetails should return details when token exists
     * and is supported on toChain
     * @dependencies
     * - TokenMap
     * @scenario
     * - call private getTokenDetails via bracket-notation with existing token and supported target
     * - check returned mapping contains expected chains and details
     * @expected
     * - it should return mapping object with both ergo and cardano entries
     */
    it(`should return details when token exists and is supported on toChain`, () => {
      const details = rosenUserInterface['getTokenDetails'](
        'ergo',
        'erg',
        'cardano',
      );

      expect(details).deep.equal(expectedErgTokenSet);
    });

    /**
     * @target getTokenDetails should throw TokenNotFoundException when token not found
     * @dependencies
     * - TokenMap
     * @scenario
     * - call private getTokenDetails via bracket-notation with non-existent token
     * - check if TokenNotFoundException is thrown
     * @expected
     * - it should throw TokenNotFoundException
     */
    it(`should throw TokenNotFoundException when token is not found`, () => {
      expect(() => {
        rosenUserInterface['getTokenDetails'](
          'ergo',
          'non-existent-token',
          'cardano',
        );
      }).toThrow(TokenNotFoundException);
    });

    /**
     * @target getTokenDetails should throw ChainNotSupportedException when target chain not supported
     * @dependencies
     * - TokenMap
     * @scenario
     * - call private getTokenDetails via bracket-notation with unsupported target chain
     * - check if ChainNotSupportedException is thrown
     * @expected
     * - it should throw ChainNotSupportedException
     */
    it(`should throw ChainNotSupportedException when target chain is not supported`, () => {
      expect(() => {
        rosenUserInterface['getTokenDetails']('ergo', 'erg', 'bitcoin');
      }).toThrow(ChainNotSupportedException);
    });
  });

  describe(`calculateFeeToAssetUnitNetworkFee`, () => {
    /**
     * @target calculateFeeToAssetUnitNetworkFee should calculate fee to asset unit network fee correctly
     * @dependencies
     * @scenario
     * - set ADA RSN ratio/divisor and ERG RSN ratio/divisor
     * - set base network fee to 4 ADA (assuming 6 decimals => 4_000_000)
     * - call private calculateFeeToAssetUnitNetworkFee
     * - check returned value
     * @expected
     * - it should return 2_000_000_000n
     */
    it(`should calculate fee to asset unit network fee correctly`, () => {
      const nativeRsnRatio = 10n ** 8n; // ADA
      const nativeRsnDivisor = 10n ** 10n; // ADA
      const assetRsnRatio = 2n * 10n ** 7n; // ERG
      const assetRsnDivisor = 10n ** 12n; // ERG

      const baseNetworkFeeAda = 4_000_000n; // 4 ADA with 6 decimals

      const result = rosenUserInterface['calculateFeeToAssetUnitNetworkFee'](
        nativeRsnRatio,
        nativeRsnDivisor,
        assetRsnRatio,
        assetRsnDivisor,
        baseNetworkFeeAda,
      );

      expect(result).toEqual(2_000_000_000n);
    });
  });

  describe(`getMinimumTransferAmountForToken`, () => {
    /**
     * @target getMinimumTransferAmountForToken should return minimum transfer amount with fixed decimals tokens
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return an object whose getFee returns ChainMinimumFee
     * - call getMinimumTransferAmountForToken for erg from ergo to cardano
     * - check returned minimum transfer amount
     * @expected
     * - it should return correct value (bridgeFee + networkFee + 1n)
     */
    it(`should return minimum transfer amount with fixed decimals tokens`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [ergToCardanoFeeSample]);

      const result = await rosenUserInterface.getMinimumTransferAmountForToken(
        'ergo',
        'erg',
        1509000,
        'cardano',
      );

      expect(result).toEqual(750000001n);
    });

    /**
     * @target getMinimumTransferAmountForToken `should return min transfer amount for tokens like ETH from insignificant toChain decimal correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call convertFeeToAssetUnit for rpnETH from ergo to cardano
     * - check returned minimum transfer amount
     * @expected
     * - it should return correct value
     */
    it(`should return min transfer amount for tokens like ETH from insignificant toChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [ethToEthereumFeeSample]);

      const result = await rosenUserInterface.getMinimumTransferAmountForToken(
        'ergo',
        '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
        1599000,
        'ethereum',
      );
      expect(result).toEqual(1142859n);
    });

    /**
     * @target getMinimumTransferAmountForToken should return min transfer amount for tokens like ETH from insignificant fromChain decimal correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call getMinimumTransferAmountForToken for eth from ethereum to ergo
     * - check returned minimum transfer amount
     * @expected
     * - it should return correct value
     */
    it(`should return min transfer amount for tokens like ETH from insignificant fromChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [ethToErgoFeeSample]);

      const result = await rosenUserInterface.getMinimumTransferAmountForToken(
        'ethereum',
        'eth',
        23159000,
        'ergo',
      );

      expect(result).toEqual(257145000000000n);
    });
  });

  describe(`getFeeByTransferAmount`, () => {
    /**
     * @target getFeeByTransferAmount should calculate fees by transfer amount without base network fee correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call getFeeByTransferAmount for rpnERG from cardano to ergo
     * - check returned fees amount
     * @expected
     * - it should return correct bridgeFee
     * - it should return correct networkFee
     */
    it(`should calculate fees by transfer amount without base network fee correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [
        ergToErgoFeeSample,
        ergToErgoFeeSample,
        ergToErgoFeeSample,
      ]);

      const result = await rosenUserInterface.getFeeByTransferAmount(
        'cardano',
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e455247',
        12311000,
        'ergo',
        5000000000000n,
      );

      expect(result.bridgeFee).toEqual(50000000000n);
      expect(result.networkFee).toEqual(200000000n);
    });

    /**
     * @target getFeeByTransferAmount should calculate fees by transfer amount with fixed decimals tokens correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return an object whose getFee returns ChainMinimumFee
     * - call getFeeByTransferAmount for rpnERG from cardano to ergo
     * - check returned fees amount
     * @expected
     * - it should return correct bridgeFee
     * - it should return correct networkFee
     */
    it(`should calculate fees by transfer amount with fixed decimals tokens correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [
        ergToErgoFeeSample,
        ergToErgoFeeSample,
        ergToErgoFeeSample,
      ]);

      const result = await rosenUserInterface.getFeeByTransferAmount(
        'cardano',
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e455247',
        12311000,
        'ergo',
        5000000000000n,
        400000000n,
      );

      expect(result.bridgeFee).toEqual(50000000000n);
      expect(result.networkFee).toEqual(400000000n);
    });

    /**
     * @target getFeeByTransferAmount should calculate fees by transfer amount for tokens like ETH from insignificant toChain decimal correctly`
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call getFeeByTransferAmount for rpnETH from ergo to ethereum
     * - check returned fees amount
     * @expected
     * - it should return correct bridgeFee
     * - it should return correct networkFee
     */
    it(`should calculate fees by transfer amount for tokens like ETH from insignificant toChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [ethToEthereumFeeSample]);

      const result = await rosenUserInterface.getFeeByTransferAmount(
        'ergo',
        '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
        1599000,
        'ethereum',
        300000000n,
      );

      expect(result.bridgeFee).toEqual(3000000n);
      expect(result.networkFee).toEqual(1000000n);
    });

    /**
     * @target getFeeByTransferAmount should calculate fees by transfer amount for tokens like ETH from insignificant fromChain decimal correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call getFeeByTransferAmount for eth from ethereum to ergo
     * - check returned fees amount
     * @expected
     * - it should return correct bridgeFee
     * - it should return correct networkFee
     */
    it(`should calculate fees by transfer amount for tokens like ETH from insignificant fromChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [ethToErgoFeeSample]);

      const result = await rosenUserInterface.getFeeByTransferAmount(
        'ethereum',
        'eth',
        23232769,
        'ergo',
        300000000000000000n,
      );

      expect(result.bridgeFee).toEqual(3000000000000000n);
      expect(result.networkFee).toEqual(114286000000000n);
    });
  });

  describe(`convertFeeToAssetUnit`, () => {
    /**
     * @target convertFeeToAssetUnit should convert fee to asset unit with fixed decimals tokens correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return an object whose getFee returns ChainMinimumFee
     * - call convertFeeToAssetUnit for rpnRSN from cardano to ergo
     * - check returned fees amount
     * @expected
     * - it should return correct value
     */
    it(`should convert fee to asset unit with fixed decimals tokens correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [
        rsnFeeSample,
        ergToCardanoFeeSample,
      ]);

      const result = await rosenUserInterface.convertFeeToAssetUnit(
        'cardano',
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e52534e',
        12311000,
        'ergo',
        200000000n, // Current base network fee in Rosen Pandora
      );
      expect(result).toEqual(40000n);
    });

    /**
     * @target convertFeeToAssetUnit should convert fee to asset unit for tokens like ETH from insignificant toChain decimal correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return an object whose getFee returns ChainMinimumFee
     * - call convertFeeToAssetUnit for rpnETH from ergo to cardano
     * - check returned fees amount
     * @expected
     * - it should return correct value
     */
    it(`should convert fee to asset unit for tokens like ETH from insignificant toChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [
        ethToEthereumFeeSample,
        ethToEthereumFeeSample,
      ]);

      const result = await rosenUserInterface.convertFeeToAssetUnit(
        'ergo',
        '6cf0dd0ebd2c791c2aa8c2a083c16d15fc0e7b609d1dbddb553f319754acfcc1',
        1599000,
        'ethereum',
        1000000000000000n, // Current base network fee in Rosen Pandora
      );
      expect(result).toEqual(1000000n);
    });

    /**
     * @target convertFeeToAssetUnit should convert fee to asset unit for tokens like ETH from insignificant fromChain decimal correctly
     * @dependencies
     * - getMinimumFeeBox
     * @scenario
     * - mock getMinimumFeeBox to return fixed ChainMinimumFee
     * - call getFeeByTransferAmount for eth from ethereum to ergo
     * - check returned fee amount
     * @expected
     * - it should return correct value
     */
    it(`should convert fee to asset unit for tokens like ETH from insignificant fromChain decimal correctly`, async () => {
      mockGetMinimumFeeBox(rosenUserInterface, [
        ethToErgoFeeSample,
        ergToCardanoFeeSample,
      ]);

      const result = await rosenUserInterface.convertFeeToAssetUnit(
        'ethereum',
        'eth',
        23232769,
        'ergo',
        200000000n, // Current base network fee in Rosen Pandora
      );

      expect(result).toEqual(114286000000000n);
    });
  });
});
