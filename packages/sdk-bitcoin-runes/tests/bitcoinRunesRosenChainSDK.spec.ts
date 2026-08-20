import { Psbt } from 'bitcoinjs-lib';

import { encodeAddress } from '@rosen-bridge/address-codec';
import {
  EmptyTokenMapException,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import {
  BitcoinRunesRosenChainSDK,
  MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT,
} from '../lib';
import {
  InvalidAddressException,
  InvalidTaprootInfoException,
  InvalidUtxoException,
  UnsupportedTokenException,
} from '../lib';
import {
  adaRuneUtxos,
  bitcoinRunesLockAddress,
  insufficientUtxos,
  invalidAddressUtxos,
  legacyAddress,
  mixedAddressUtxos,
  nativeSegwitAddress,
  nativeSegwitUtxos,
  networkParams,
  pythagorasRuneId,
  adaRuneId,
  rosenDataAdaRuneBridge,
  rosenDataRuneBridge,
  rosenTokens,
  sameAddressUtxos,
  taprootAddress,
  taprootInternalPubkey,
  taprootUtxos,
  LOCK_OUTPUT_INDEX,
  CHANGE_OUTPUT_INDEX,
  RUNESTONE_OUTPUT_INDEX,
  OUTPUTS_COUNT,
  FIRST_DATA_OUTPUT_INDEX,
} from './testData';
import {
  extractLockData,
  extractRunestone,
  parseRosenData,
  toAsyncUtxoIterator,
  toUtxoIterator,
} from './utils';

describe(`BitcoinRunesRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(rosenTokens);
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataRuneBridge.toAddress,
      );
      const transferAmount = 100000n;

      // call generateLockTransaction
      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        pythagorasRuneId,
        toChain,
        toEncodedAddress,
        nativeSegwitAddress,
        transferAmount,
        BigInt(rosenDataRuneBridge.bridgeFee),
        BigInt(rosenDataRuneBridge.networkFee),
        toUtxoIterator(nativeSegwitUtxos),
        networkParams,
      );

      // parse the unsigned transaction
      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.toHex()).toEqual(result.psbtHex);
      expect(psbt.txOutputs).toHaveLength(OUTPUTS_COUNT);

      // check change output
      expect(psbt.txOutputs[CHANGE_OUTPUT_INDEX].address).toEqual(
        nativeSegwitAddress,
      );

      // check runestone output
      expect(psbt.txOutputs[RUNESTONE_OUTPUT_INDEX].value).toEqual(0);
      expect(extractRunestone(psbt)).toEqual({
        edicts: [
          {
            id: { block: 914209n, tx: 2664 },
            amount: transferAmount,
            output: LOCK_OUTPUT_INDEX,
          },
        ],
        pointer: CHANGE_OUTPUT_INDEX,
      });

      // check lock output
      expect(psbt.txOutputs[LOCK_OUTPUT_INDEX].address).toEqual(
        bitcoinRunesLockAddress,
      );
      expect(psbt.txOutputs[LOCK_OUTPUT_INDEX].value).toEqual(
        Number(MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT),
      );

      // check data outputs
      expect(
        psbt.txOutputs.slice(FIRST_DATA_OUTPUT_INDEX).map((box) => box.value),
      ).toEqual([294, 295, 296]);
      expect(
        parseRosenData(extractLockData(psbt, FIRST_DATA_OUTPUT_INDEX)),
      ).toEqual({
        toChain: rosenDataRuneBridge.toChain,
        toAddress: rosenDataRuneBridge.toAddress,
        bridgeFee: rosenDataRuneBridge.wrappedBridgeFee,
        networkFee: rosenDataRuneBridge.wrappedNetworkFee,
      });

      // check inputs
      expect(psbt.inputCount).toEqual(1);
      expect(result.signInputs).toEqual({ [nativeSegwitAddress]: [0] });
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        pythagorasRuneId,
        toChain,
        toEncodedAddress,
        taprootAddress,
        100000n,
        BigInt(rosenDataRuneBridge.bridgeFee),
        BigInt(rosenDataRuneBridge.networkFee),
        toUtxoIterator(taprootUtxos),
        networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.txOutputs).toHaveLength(OUTPUTS_COUNT);
      expect(psbt.txOutputs[CHANGE_OUTPUT_INDEX].address).toEqual(
        taprootAddress,
      );
      expect(psbt.data.inputs[0].tapInternalKey?.toString('hex')).toEqual(
        taprootInternalPubkey,
      );
      expect(result.signInputs).toEqual({ [taprootAddress]: [0] });
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        pythagorasRuneId,
        toChain,
        toEncodedAddress,
        nativeSegwitAddress,
        100000n,
        BigInt(rosenDataRuneBridge.bridgeFee),
        BigInt(rosenDataRuneBridge.networkFee),
        toAsyncUtxoIterator(mixedAddressUtxos),
        networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.inputCount).toEqual(2);
      expect(result.signInputs).toEqual({
        [taprootAddress]: [0],
        [nativeSegwitAddress]: [1],
      });
      expect(psbt.data.inputs[0].tapInternalKey?.toString('hex')).toEqual(
        taprootInternalPubkey,
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        pythagorasRuneId,
        toChain,
        toEncodedAddress,
        nativeSegwitAddress,
        100000n,
        BigInt(rosenDataRuneBridge.bridgeFee),
        BigInt(rosenDataRuneBridge.networkFee),
        toUtxoIterator(sameAddressUtxos),
        networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(psbt.inputCount).toEqual(2);
      expect(result.signInputs).toEqual({ [nativeSegwitAddress]: [0, 1] });
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.CARDANO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataAdaRuneBridge.toAddress,
      );

      const result = await bitcoinRunesRosenChainSDK.generateLockTransaction(
        adaRuneId,
        toChain,
        toEncodedAddress,
        nativeSegwitAddress,
        100000n,
        BigInt(rosenDataAdaRuneBridge.bridgeFee),
        BigInt(rosenDataAdaRuneBridge.networkFee),
        toUtxoIterator(adaRuneUtxos),
        networkParams,
      );

      const psbt = Psbt.fromBase64(result.psbt);
      expect(
        parseRosenData(extractLockData(psbt, FIRST_DATA_OUTPUT_INDEX)),
      ).toEqual({
        toChain: rosenDataAdaRuneBridge.toChain,
        toAddress: rosenDataAdaRuneBridge.toAddress,
        bridgeFee: rosenDataAdaRuneBridge.bridgeFee,
        networkFee: rosenDataAdaRuneBridge.networkFee,
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          'btc',
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          nativeSegwitAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(nativeSegwitUtxos),
          networkParams,
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          pythagorasRuneId,
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          legacyAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(nativeSegwitUtxos),
          networkParams,
        ),
      ).rejects.toThrow(InvalidAddressException);
    });

    /**
     * @target generateLockTransaction should throw InvalidUtxoException when a
     * utxo address is neither taproot nor native segwit
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with a utxo of a legacy address
     * @expected
     * - generateLockTransaction should throw InvalidUtxoException
     */
    it(`should throw InvalidUtxoException when a utxo address is neither taproot nor native segwit`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          pythagorasRuneId,
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          nativeSegwitAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(invalidAddressUtxos),
          networkParams,
        ),
      ).rejects.toThrow(InvalidUtxoException);
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
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          pythagorasRuneId,
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          nativeSegwitAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(insufficientUtxos),
          networkParams,
        ),
      ).rejects.toThrow(InsufficientAssetsException);
    });

    /**
     * @target generateLockTransaction should throw InvalidTaprootInfoException when
     * the internal pubkey of a taproot utxo is not provided
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with tokenMap and bitcoinRunesLockAddress
     * - call generateLockTransaction with networkParams missing the internal pubkey
     *   of the taproot utxo address
     * @expected
     * - generateLockTransaction should throw InvalidTaprootInfoException
     */
    it(`should throw InvalidTaprootInfoException when the internal pubkey of a taproot utxo is not provided`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        tokenMap,
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          pythagorasRuneId,
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          nativeSegwitAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(taprootUtxos),
          {
            ...networkParams,
            taprootScriptInfo: new Map(),
          },
        ),
      ).rejects.toThrow(InvalidTaprootInfoException);
    });

    /**
     * @target generateLockTransaction should throw EmptyTokenMapException when
     * the token map is empty
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate BitcoinRunesRosenChainSDK with an empty tokenMap
     * - call generateLockTransaction
     * @expected
     * - generateLockTransaction should throw EmptyTokenMapException
     */
    it(`should throw EmptyTokenMapException when the token map is empty`, async () => {
      const bitcoinRunesRosenChainSDK = new BitcoinRunesRosenChainSDK(
        new TokenMap(),
        bitcoinRunesLockAddress,
      );
      const toChain = NETWORKS.ERGO;

      await expect(
        bitcoinRunesRosenChainSDK.generateLockTransaction(
          pythagorasRuneId,
          toChain,
          encodeAddress(toChain, rosenDataRuneBridge.toAddress),
          nativeSegwitAddress,
          100000n,
          BigInt(rosenDataRuneBridge.bridgeFee),
          BigInt(rosenDataRuneBridge.networkFee),
          toUtxoIterator(nativeSegwitUtxos),
          networkParams,
        ),
      ).rejects.toThrow(EmptyTokenMapException);
    });
  });
});
