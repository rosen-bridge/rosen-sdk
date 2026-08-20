import { BitcoinRunesUtxo } from '@rosen-bridge/bitcoin-runes-utxo-selection';

import { InvalidUtxoException } from '../lib';
import {
  generateFeeEstimatorWithAssumptions,
  isNativeSegWit,
  isTaproot,
  isValidBitcoinRunesAddress,
  makeP2wpkhPayment,
  makeTaprootPayment,
  validateBitcoinRunesUtxo,
} from '../lib/utils';
import {
  legacyAddress,
  nativeSegwitAddress,
  secondTaprootAddress,
  taprootAddress,
  taprootInternalPubkey,
} from './testData';

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
      expect(isNativeSegWit(nativeSegwitAddress)).toEqual(true);
      expect(isNativeSegWit(nativeSegwitAddress.toUpperCase())).toEqual(true);
      expect(isNativeSegWit(taprootAddress)).toEqual(false);
      expect(isNativeSegWit(legacyAddress)).toEqual(false);
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
      expect(isTaproot(taprootAddress)).toEqual(true);
      expect(isTaproot(taprootAddress.toUpperCase())).toEqual(true);
      expect(isTaproot(nativeSegwitAddress)).toEqual(false);
      expect(isTaproot(legacyAddress)).toEqual(false);
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
      expect(isValidBitcoinRunesAddress(nativeSegwitAddress)).toEqual(true);
      expect(isValidBitcoinRunesAddress(taprootAddress)).toEqual(true);
      expect(isValidBitcoinRunesAddress(legacyAddress)).toEqual(false);
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
      const payment = makeP2wpkhPayment(nativeSegwitAddress);

      expect(payment.address).toEqual(nativeSegwitAddress);
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
      expect(() => makeP2wpkhPayment(taprootAddress)).toThrow();
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
      const payment = makeTaprootPayment(taprootInternalPubkey, taprootAddress);

      expect(payment.address).toEqual(taprootAddress);
      expect(payment.internalPubkey?.toString('hex')).toEqual(
        taprootInternalPubkey,
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
        makeTaprootPayment(taprootInternalPubkey, secondTaprootAddress),
      ).toThrow();
    });
  });

  describe(`validateBitcoinRunesUtxo`, () => {
    /**
     * @target validateBitcoinRunesUtxo should accept utxos of taproot and native
     * segwit addresses
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with utxos of a native segwit and a taproot address
     * @expected
     * - validateBitcoinRunesUtxo should not throw
     */
    it(`should accept utxos of taproot and native segwit addresses`, () => {
      const utxo: BitcoinRunesUtxo = {
        txId: 'd1797fa384ada5953128474f397b31d18681376fb542e24c2e1f79ee94799637',
        index: 0,
        value: 294n,
        runes: [],
        address: nativeSegwitAddress,
      };

      expect(() => validateBitcoinRunesUtxo(utxo)).not.toThrow();
      expect(() =>
        validateBitcoinRunesUtxo({ ...utxo, address: taprootAddress }),
      ).not.toThrow();
    });

    /**
     * @target validateBitcoinRunesUtxo should throw InvalidUtxoException when the
     * utxo address is invalid or missing
     * @dependencies
     * @scenario
     * - call validateBitcoinRunesUtxo with a utxo of a legacy address
     * - call validateBitcoinRunesUtxo with a utxo without address
     * @expected
     * - validateBitcoinRunesUtxo should throw InvalidUtxoException in both cases
     */
    it(`should throw InvalidUtxoException when the utxo address is invalid or missing`, () => {
      const utxo: BitcoinRunesUtxo = {
        txId: 'd1797fa384ada5953128474f397b31d18681376fb542e24c2e1f79ee94799637',
        index: 0,
        value: 294n,
        runes: [],
        address: legacyAddress,
      };

      expect(() => validateBitcoinRunesUtxo(utxo)).toThrow(
        InvalidUtxoException,
      );
      expect(() =>
        validateBitcoinRunesUtxo({ ...utxo, address: undefined }),
      ).toThrow(InvalidUtxoException);
    });
  });

  describe(`generateFeeEstimatorWithAssumptions`, () => {
    const nativeSegwitUtxo: BitcoinRunesUtxo = {
      txId: 'd1797fa384ada5953128474f397b31d18681376fb542e24c2e1f79ee94799637',
      index: 0,
      value: 294n,
      runes: [],
      address: nativeSegwitAddress,
    };
    const taprootUtxo: BitcoinRunesUtxo = {
      ...nativeSegwitUtxo,
      address: taprootAddress,
    };

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
        nativeSegwitAddress,
      );

      // vsize = (42 + 272 + (36 + 10 * 4) + 5 * 124) / 4 = 252.5
      expect(estimateFee([nativeSegwitUtxo], 1)).toEqual(505n);
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
        taprootAddress,
      );

      // vsize = (42 + 230 + (36 + 10 * 4) + 4 * 124 + 1 * 172) / 4 = 254
      expect(estimateFee([taprootUtxo], 1)).toEqual(254n);
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
        legacyAddress,
      );

      // vsize = (42 + 230 + 272 + (36 + 10 * 4) + 4 * 124) / 4 = 279
      expect(estimateFee([taprootUtxo, nativeSegwitUtxo], 0)).toEqual(837n);
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
        nativeSegwitAddress,
      );

      const estimations = [
        estimateFee([nativeSegwitUtxo], 1),
        estimateFee([nativeSegwitUtxo], 1),
        estimateFee([nativeSegwitUtxo], 1),
      ];

      expect(estimations).toEqual([505n, 505n, 505n]);
    });
  });
});
