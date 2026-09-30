import { Psbt } from 'bitcoinjs-lib';

import { encodeAddress } from '@rosen-bridge/address-codec';
import { InsufficientAssetsException } from '@rosen-bridge/sdk-abstract';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import {
  BitcoinRunesRosenChainSDK,
  MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT,
  InvalidAddressException,
  InvalidUtxoTaprootInfoException,
  InvalidUtxoAddressException,
  UnsupportedTokenException,
} from '../lib';
import * as testData from './testData';
import {
  extractLockData,
  extractRunestone,
  parseRosenData,
  toAsyncUtxoIterator,
} from './utils';

describe(`BitcoinRunesRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(testData.rosenTokens);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly
     * with a native segwit source address
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction for a rune transfer from a native segwit address to Ergo
     * - parse the unsigned transaction using Psbt
     * - check the returned value
     * @expected
     * - unsigned transaction should have 6 outputs
     * - change output should be sent to the source address
     * - runestone output should transfer the rune amount to the lock output
     *   and point the leftover runes to the change output
     * - lock output should be sent to the lock address with the minimum satoshi
     * - data outputs should carry the rosen data with 1 additional satoshi each
     * - signInputs should map the source address to its input indexes
     */
    it(`should generate lock transaction correctly with a native segwit source address`, async () => {
      // instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        testData.rosenDataRuneBridge.toAddress,
      );

      // call generateLockTransaction
      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        testData.pythagorasRuneId,
        toChain,
        toEncodedAddress,
        testData.nativeSegwitAddress,
        testData.transferAmount,
        BigInt(testData.rosenDataRuneBridge.bridgeFee),
        BigInt(testData.rosenDataRuneBridge.networkFee),
        testData.nativeSegwitUtxos.values(),
        testData.networkParams,
      );

      // parse the unsigned transaction
      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.toHex()).toEqual(result.psbtHex);
      expect(psbt.txOutputs).toHaveLength(testData.OUTPUTS_COUNT);

      // check change output
      expect(psbt.txOutputs[testData.CHANGE_OUTPUT_INDEX].address).toEqual(
        testData.nativeSegwitAddress,
      );

      // check runestone output
      expect(psbt.txOutputs[testData.RUNESTONE_OUTPUT_INDEX].value).toEqual(0);
      expect(extractRunestone(psbt)).toEqual({
        edicts: [
          {
            id: testData.pythagorasRunestoneId,
            amount: testData.transferAmount,
            output: testData.LOCK_OUTPUT_INDEX,
          },
        ],
        pointer: testData.CHANGE_OUTPUT_INDEX,
      });

      // check lock output
      expect(psbt.txOutputs[testData.LOCK_OUTPUT_INDEX].address).toEqual(
        testData.bitcoinRunesLockAddress,
      );
      expect(psbt.txOutputs[testData.LOCK_OUTPUT_INDEX].value).toEqual(
        Number(MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT),
      );

      // check data outputs
      expect(
        psbt.txOutputs
          .slice(testData.FIRST_DATA_OUTPUT_INDEX)
          .map((box) => box.value),
      ).toEqual([294, 295, 296]);
      expect(
        parseRosenData(extractLockData(psbt, testData.FIRST_DATA_OUTPUT_INDEX)),
      ).toEqual({
        toChain: testData.rosenDataRuneBridge.toChain,
        toAddress: testData.rosenDataRuneBridge.toAddress,
        bridgeFee: testData.rosenDataRuneBridge.wrappedBridgeFee,
        networkFee: testData.rosenDataRuneBridge.wrappedNetworkFee,
      });

      // check inputs
      expect(psbt.inputCount).toEqual(1);
      expect(result.signInputs).toEqual({
        [testData.nativeSegwitAddress]: [0],
      });
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly
     * with a taproot source address
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction for a rune transfer from a taproot address to Ergo
     * - parse the unsigned transaction using Psbt
     * - check the returned value
     * @expected
     * - change output should be sent to the taproot source address
     * - input should carry the internal pubkey of the taproot address
     * - signInputs should map the taproot address to its input indexes
     */
    it(`should generate lock transaction correctly with a taproot source address`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        testData.rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        testData.pythagorasRuneId,
        toChain,
        toEncodedAddress,
        testData.taprootAddress,
        testData.transferAmount,
        BigInt(testData.rosenDataRuneBridge.bridgeFee),
        BigInt(testData.rosenDataRuneBridge.networkFee),
        testData.taprootUtxos.values(),
        testData.networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.txOutputs).toHaveLength(testData.OUTPUTS_COUNT);
      expect(psbt.txOutputs[testData.CHANGE_OUTPUT_INDEX].address).toEqual(
        testData.taprootAddress,
      );
      expect(psbt.data.inputs[0].tapInternalKey?.toString('hex')).toEqual(
        testData.taprootInternalPubkey,
      );
      expect(result.signInputs).toEqual({ [testData.taprootAddress]: [0] });
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly
     * when the selected utxos belong to different addresses
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with an async iterator of utxos of two addresses
     * - parse the unsigned transaction using Psbt
     * - check the returned value
     * @expected
     * - both utxos should be added as inputs
     * - signInputs should map each address to its own input indexes
     */
    it(`should generate lock transaction correctly when the selected utxos belong to different addresses`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        testData.rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        testData.pythagorasRuneId,
        toChain,
        toEncodedAddress,
        testData.nativeSegwitAddress,
        testData.transferAmount,
        BigInt(testData.rosenDataRuneBridge.bridgeFee),
        BigInt(testData.rosenDataRuneBridge.networkFee),
        toAsyncUtxoIterator(testData.mixedAddressUtxos),
        testData.networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.inputCount).toEqual(2);
      expect(result.signInputs).toEqual({
        [testData.taprootAddress]: [0],
        [testData.nativeSegwitAddress]: [1],
      });
      expect(psbt.data.inputs[0].tapInternalKey?.toString('hex')).toEqual(
        testData.taprootInternalPubkey,
      );
      expect(psbt.data.inputs[1].tapInternalKey).toBeUndefined();
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly
     * when multiple utxos of the source address are selected
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with two utxos of the source address
     * - parse the unsigned transaction using Psbt
     * - check the returned value
     * @expected
     * - both utxos should be added as inputs
     * - signInputs should map the source address to both input indexes
     */
    it(`should generate lock transaction correctly when multiple utxos of the source address are selected`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        testData.rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        testData.pythagorasRuneId,
        toChain,
        toEncodedAddress,
        testData.nativeSegwitAddress,
        testData.transferAmount,
        BigInt(testData.rosenDataRuneBridge.bridgeFee),
        BigInt(testData.rosenDataRuneBridge.networkFee),
        testData.sameAddressUtxos.values(),
        testData.networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.inputCount).toEqual(2);
      expect(result.signInputs).toEqual({
        [testData.nativeSegwitAddress]: [0, 1],
      });
    });

    /**
     * @target generateLockTransaction should not drop any decimal of the fees when
     * the rune holds the significant decimals of its token set
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction for a rune whose decimals equal the significant decimals
     * - parse the unsigned transaction using Psbt
     * - check the rosen data of the data outputs
     * @expected
     * - bridge fee and network fee should be written into the lock data unchanged
     */
    it(`should not drop any decimal of the fees when the runes holds the significant decimals of its token set`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.CARDANO;
      const toEncodedAddress = encodeAddress(
        toChain,
        testData.rosenDataAdaRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        testData.adaRuneId,
        toChain,
        toEncodedAddress,
        testData.nativeSegwitAddress,
        testData.transferAmount,
        BigInt(testData.rosenDataAdaRuneBridge.bridgeFee),
        BigInt(testData.rosenDataAdaRuneBridge.networkFee),
        testData.adaRuneUtxos.values(),
        testData.networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(
        parseRosenData(extractLockData(psbt, testData.FIRST_DATA_OUTPUT_INDEX)),
      ).toEqual({
        toChain: testData.rosenDataAdaRuneBridge.toChain,
        toAddress: testData.rosenDataAdaRuneBridge.toAddress,
        bridgeFee: testData.rosenDataAdaRuneBridge.bridgeFee,
        networkFee: testData.rosenDataAdaRuneBridge.networkFee,
      });
    });

    /**
     * @target generateLockTransaction should throw UnsupportedTokenException when
     * the token is the native token of the chain
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with btc as the token id
     * @expected
     * - generateLockTransaction should throw UnsupportedTokenException
     */
    it(`should throw UnsupportedTokenException when the token is the native token of the chain`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          'btc-runes',
          toChain,
          encodeAddress(toChain, testData.rosenDataRuneBridge.toAddress),
          testData.nativeSegwitAddress,
          testData.transferAmount,
          BigInt(testData.rosenDataRuneBridge.bridgeFee),
          BigInt(testData.rosenDataRuneBridge.networkFee),
          testData.nativeSegwitUtxos.values(),
          testData.networkParams,
        ),
      ).rejects.toThrow(UnsupportedTokenException);
    });

    /**
     * @target generateLockTransaction should throw InvalidAddressException when
     * the source address is neither taproot nor native segwit
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with a legacy source address
     * @expected
     * - generateLockTransaction should throw InvalidAddressException
     */
    it(`should throw InvalidAddressException when the source address is neither taproot nor native segwit`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          testData.pythagorasRuneId,
          toChain,
          encodeAddress(toChain, testData.rosenDataRuneBridge.toAddress),
          testData.legacyAddress,
          testData.transferAmount,
          BigInt(testData.rosenDataRuneBridge.bridgeFee),
          BigInt(testData.rosenDataRuneBridge.networkFee),
          testData.nativeSegwitUtxos.values(),
          testData.networkParams,
        ),
      ).rejects.toThrow(InvalidAddressException);
    });

    /**
     * @target generateLockTransaction should throw InvalidUtxoAddressException when a
     * utxo address is neither taproot nor native segwit
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with a utxo of a legacy address
     * @expected
     * - generateLockTransaction should throw InvalidUtxoAddressException
     */
    it(`should throw InvalidUtxoAddressException when a utxo address is neither taproot nor native segwit`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          testData.pythagorasRuneId,
          toChain,
          encodeAddress(toChain, testData.rosenDataRuneBridge.toAddress),
          testData.nativeSegwitAddress,
          testData.transferAmount,
          BigInt(testData.rosenDataRuneBridge.bridgeFee),
          BigInt(testData.rosenDataRuneBridge.networkFee),
          testData.invalidAddressUtxos.values(),
          testData.networkParams,
        ),
      ).rejects.toThrow(InvalidUtxoAddressException);
    });

    /**
     * @target generateLockTransaction should throw InsufficientAssetsException when
     * the utxos do not cover the required assets
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with utxos that do not cover the required satoshi
     * @expected
     * - generateLockTransaction should throw InsufficientAssetsException
     */
    it(`should throw InsufficientAssetsException when the utxos do not cover the required assets`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          testData.pythagorasRuneId,
          toChain,
          encodeAddress(toChain, testData.rosenDataRuneBridge.toAddress),
          testData.nativeSegwitAddress,
          testData.transferAmount,
          BigInt(testData.rosenDataRuneBridge.bridgeFee),
          BigInt(testData.rosenDataRuneBridge.networkFee),
          testData.insufficientUtxos.values(),
          testData.networkParams,
        ),
      ).rejects.toThrow(InsufficientAssetsException);
    });

    /**
     * @target generateLockTransaction should throw InvalidUtxoTaprootInfoException when
     * the internal pubkey of a taproot utxo is not provided
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with networkParams missing the internal pubkey
     *   of the taproot utxo address
     * @expected
     * - generateLockTransaction should throw InvalidUtxoTaprootInfoException
     */
    it(`should throw InvalidTaprootInfoException when the internal pubkey of a taproot utxo is not provided`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        testData.bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          testData.pythagorasRuneId,
          toChain,
          encodeAddress(toChain, testData.rosenDataRuneBridge.toAddress),
          testData.nativeSegwitAddress,
          testData.transferAmount,
          BigInt(testData.rosenDataRuneBridge.bridgeFee),
          BigInt(testData.rosenDataRuneBridge.networkFee),
          testData.taprootUtxos.values(),
          {
            ...testData.networkParams,
            taprootScriptInfo: new Map(),
          },
        ),
      ).rejects.toThrow(InvalidUtxoTaprootInfoException);
    });
  });
});
