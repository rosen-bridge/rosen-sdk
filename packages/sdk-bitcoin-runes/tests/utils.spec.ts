import { InvalidUtxoAddressException } from '../lib';
import {
  generateFeeEstimatorWithAssumptions,
  isNativeSegWit,
  isTaproot,
  isValidBitcoinRunesAddress,
  makeP2wpkhPayment,
  makeTaprootPayment,
  validateBitcoinRunesUtxo,
} from '../lib/utils';
import * as testData from './testData';

describe(`utils`, () => {
  describe(`isNativeSegWit`, () => {
    /**
     * @target isNativeSegWit should detect native segwit addresses
     * @dependencies
     * @scenario
     * - call isNativeSegWit with native segwit, taproot and legacy addresses
     * - check the returned values
     * @expected
     * - only native segwit addresses should be detected, regardless of their case
     */
    it(`should detect native segwit addresses`, () => {
      expect(isNativeSegWit(testData.nativeSegwitAddress)).toEqual(true);
      expect(
        isNativeSegWit(testData.nativeSegwitAddress.toUpperCase()),
      ).toEqual(true);
      expect(isNativeSegWit(testData.taprootAddress)).toEqual(false);
      expect(isNativeSegWit(testData.legacyAddress)).toEqual(false);
    });
  });

  describe(`isTaproot`, () => {
    /**
     * @target isTaproot should detect taproot addresses
     * @dependencies
     * @scenario
     * - call isTaproot with native segwit, taproot and legacy addresses
     * - check the returned values
     * @expected
     * - only taproot addresses should be detected, regardless of their case
     */
    it(`should detect taproot addresses`, () => {
      expect(isTaproot(testData.taprootAddress)).toEqual(true);
      expect(isTaproot(testData.taprootAddress.toUpperCase())).toEqual(true);
      expect(isTaproot(testData.nativeSegwitAddress)).toEqual(false);
      expect(isTaproot(testData.legacyAddress)).toEqual(false);
    });
  });

  describe(`isValidBitcoinRunesAddress`, () => {
    /**
     * @target isValidBitcoinRunesAddress should accept only taproot and native
     * segwit addresses
     * @dependencies
     * @scenario
     * - call isValidBitcoinRunesAddress with native segwit, taproot and legacy addresses
     * - check the returned values
     * @expected
     * - taproot and native segwit addresses should be valid
     * - legacy addresses should be invalid
     */
    it(`should accept only taproot and native segwit addresses`, () => {
      expect(isValidBitcoinRunesAddress(testData.nativeSegwitAddress)).toEqual(
        true,
      );
      expect(isValidBitcoinRunesAddress(testData.taprootAddress)).toEqual(true);
      expect(isValidBitcoinRunesAddress(testData.legacyAddress)).toEqual(false);
    });
  });

  describe(`makeP2wpkhPayment`, () => {
    /**
     * @target makeP2wpkhPayment should generate the payment of a native segwit address
     * @dependencies
     * @scenario
     * - call makeP2wpkhPayment with a native segwit address
     * - check the returned payment
     * @expected
     * - the payment address should be the given address
     * - the payment output script should be generated
     */
    it(`should generate the payment of a native segwit address`, () => {
      const payment = makeP2wpkhPayment(testData.nativeSegwitAddress);

      expect(payment.address).toEqual(testData.nativeSegwitAddress);
      expect(payment.output).toBeDefined();
    });

    /**
     * @target makeP2wpkhPayment should throw when the address is not native segwit
     * @dependencies
     * @scenario
     * - call makeP2wpkhPayment with a taproot address
     * @expected
     * - makeP2wpkhPayment should throw
     */
    it(`should throw when the address is not native segwit`, () => {
      expect(() => makeP2wpkhPayment(testData.taprootAddress)).toThrow();
    });
  });

  describe(`makeTaprootPayment`, () => {
    /**
     * @target makeTaprootPayment should generate the payment of a taproot address
     * @dependencies
     * @scenario
     * - call makeTaprootPayment with a taproot address and its internal pubkey
     * - check the returned payment
     * @expected
     * - the payment address should be the given address
     * - the payment internal pubkey should be the given internal pubkey
     */
    it(`should generate the payment of a taproot address`, () => {
      const payment = makeTaprootPayment(
        testData.taprootInternalPubkey,
        testData.taprootAddress,
      );

      expect(payment.address).toEqual(testData.taprootAddress);
      expect(payment.internalPubkey?.toString('hex')).toEqual(
        testData.taprootInternalPubkey,
      );
    });

    /**
     * @target makeTaprootPayment should throw when the internal pubkey does not
     * belong to the address
     * @dependencies
     * @scenario
     * - call makeTaprootPayment with an internal pubkey of another taproot address
     * @expected
     * - makeTaprootPayment should throw
     */
    it(`should throw when the internal pubkey does not belong to the address`, () => {
      expect(() =>
        makeTaprootPayment(
          testData.taprootInternalPubkey,
          testData.secondTaprootAddress,
        ),
      ).toThrow();
    });
  });

  describe(`validateBitcoinRunesUtxo`, () => {
    /**
     * @target validateBitcoinRunesUtxo should accept a utxo of a native segwit
     * address
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with a utxo of a native segwit address
     * @expected
     * - validateBitcoinRunesUtxo should not throw
     */
    it(`should accept a utxo of a native segwit address`, () => {
      expect(() =>
        validateBitcoinRunesUtxo(testData.nativeSegwitDustUtxo),
      ).not.toThrow();
    });

    /**
     * @target validateBitcoinRunesUtxo should accept a utxo of a taproot address
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with a utxo of a taproot address
     * @expected
     * - validateBitcoinRunesUtxo should not throw
     */
    it(`should accept a utxo of a taproot address`, () => {
      expect(() =>
        validateBitcoinRunesUtxo(testData.taprootDustUtxo),
      ).not.toThrow();
    });

    /**
     * @target validateBitcoinRunesUtxo should throw InvalidUtxoAddressException when the
     * utxo address is neither taproot nor native segwit
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with a utxo of a legacy address
     * @expected
     * - validateBitcoinRunesUtxo should throw InvalidUtxoAddressException
     */
    it(`should throw InvalidUtxoAddressException when the utxo address is neither taproot nor native segwit`, () => {
      expect(() => validateBitcoinRunesUtxo(testData.legacyDustUtxo)).toThrow(
        InvalidUtxoAddressException,
      );
    });

    /**
     * @target validateBitcoinRunesUtxo should throw InvalidUtxoAddressException when the
     * utxo address is missing
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with a utxo without address
     * @expected
     * - validateBitcoinRunesUtxo should throw InvalidUtxoAddressException
     */
    it(`should throw InvalidUtxoAddressException when the utxo address is missing`, () => {
      expect(() =>
        validateBitcoinRunesUtxo(testData.noAddressDustUtxo),
      ).toThrow(InvalidUtxoAddressException);
    });
  });

  describe(`generateFeeEstimatorWithAssumptions`, () => {
    /**
     * @target generateFeeEstimatorWithAssumptions should estimate the fee of a
     * native segwit transaction
     * @dependencies
     * @scenario
     * - generate a fee estimator with a native segwit change address
     * - call the estimator with a native segwit input and a change box
     * @expected
     * - estimated fee should be the vsize of the assumed transaction times the fee ratio
     */
    it(`should estimate the fee of a native segwit transaction`, () => {
      const estimateFee = generateFeeEstimatorWithAssumptions(
        10,
        2,
        4,
        0,
        testData.nativeSegwitAddress,
      );

      // vsize = (42 + 272 + (36 + 10 * 4) + 5 * 124) / 4 = 252.5
      expect(estimateFee([testData.nativeSegwitDustUtxo], 1)).toEqual(505n);
    });

    /**
     * @target generateFeeEstimatorWithAssumptions should estimate the fee of a
     * taproot transaction
     * @dependencies
     * @scenario
     * - generate a fee estimator with a taproot change address
     * - call the estimator with a taproot input and a change box
     * @expected
     * - estimated fee should be calculated by the taproot weight units
     */
    it(`should estimate the fee of a taproot transaction`, () => {
      const estimateFee = generateFeeEstimatorWithAssumptions(
        10,
        1,
        4,
        0,
        testData.taprootAddress,
      );

      // vsize = (42 + 230 + (36 + 10 * 4) + 4 * 124 + 1 * 172) / 4 = 254
      expect(estimateFee([testData.taprootDustUtxo], 1)).toEqual(254n);
    });

    /**
     * @target generateFeeEstimatorWithAssumptions should estimate the fee of a
     * transaction with inputs of both address types
     * @dependencies
     * @scenario
     * - generate a fee estimator with a change address of neither type
     * - call the estimator with a taproot and a native segwit input
     * @expected
     * - estimated fee should count both input types
     */
    it(`should estimate the fee of a transaction with inputs of both address types`, () => {
      const estimateFee = generateFeeEstimatorWithAssumptions(
        10,
        3,
        4,
        0,
        testData.legacyAddress,
      );

      // vsize = (42 + 230 + 272 + (36 + 10 * 4) + 4 * 124) / 4 = 279
      expect(
        estimateFee(
          [testData.taprootDustUtxo, testData.nativeSegwitDustUtxo],
          0,
        ),
      ).toEqual(837n);
    });

    /**
     * @target generateFeeEstimatorWithAssumptions should estimate the same fee on
     * repeated calls
     * @dependencies
     * @scenario
     * - generate a fee estimator
     * - call the estimator three times with the same arguments
     * @expected
     * - all the estimations should be equal, since the box selection calls the
     *   estimator once per selection step
     */
    it(`should estimate the same fee on repeated calls`, () => {
      const estimateFee = generateFeeEstimatorWithAssumptions(
        10,
        2,
        4,
        0,
        testData.nativeSegwitAddress,
      );

      const estimations = [
        estimateFee([testData.nativeSegwitDustUtxo], 1),
        estimateFee([testData.nativeSegwitDustUtxo], 1),
        estimateFee([testData.nativeSegwitDustUtxo], 1),
      ];

      expect(estimations).toEqual([505n, 505n, 505n]);
    });
  });
});
