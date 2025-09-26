import { CardanoRosenChainSDK } from '../lib';
import {
  cardanoLockAddress,
  rosenTokens,
  cardanoUtxos1,
  axillaryDataErgBridge,
  protocolParameters,
  cardanoUtxos2,
  axillaryDataRSNBridge,
  deserializedTransactionUnspentOutput,
  serializedTransactionUnspentOutput,
} from './testData';
import { TokenMap } from '@rosen-bridge/tokens';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { InsufficientAssetsException } from '@rosen-bridge/sdk-abstract';
import * as wasm from '@emurgo/cardano-serialization-lib-nodejs';
import { parseMetadata } from './utils';
import { CardanoAsset } from '@rosen-bridge/cardano-utxo-selection';

describe(`CardanoRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(rosenTokens);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with ADA bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - initialize CardanoRosenChainSDK with tokenMap and cardanoLockAddress
     * - set ADA token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for ADA from Cardano to Ergo
     * - parse the unsigned transaction
     * - extract lockBox and feeValue
     * - check number of outputs
     * - check lockBox address and value
     * - check lockBox has no assets
     * - check auxiliary data
     * - check fee value
     * - iterate over change boxes, check addresses, accumulate values and assets
     * - check total change value and assets
     * @expected
     * - unsigned transaction should have 3 outputs
     * - lockBox address should match cardanoLockAddress
     * - lockBox value should match bridgeAmount
     * - lockBox should have zero assets
     * - auxiliary data should match axillaryDataErgBridge
     * - fee should be equal to expected value
     * - address of change boxes should be equal to proper fromAddress
     * - change boxes should have correct value, and assets
     */
    it(`should generate lock transaction correctly with ADA bridging`, async () => {
      // instantiate CardanoRosenChainSDK with tokenMap and cardanoLockAddress
      const cardanoRosenChainSDK = new CardanoRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
      );
      // set ADA token id, fromAddress, toAddress, and bridgeAmount
      const adaTokenIdOnCardano = 'ada';
      const fromAddress =
        'addr1q85fh9t2cn7j8g62te545uyayjtlc7cwl9df50dugpe78r5d9z85ctlucfsnmefqrehxuvjw6ws6pzc5rvwyjdl2g8us6pr89f';
      const toAddress = '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W';
      const bridgeAmount = 16_065_000_000n;
      // call generateLockTransaction for ADA from Cardano to Ergo
      const unsignedHexTx = await cardanoRosenChainSDK.generateLockTransaction(
        adaTokenIdOnCardano,
        NETWORKS.ERGO,
        toAddress,
        fromAddress,
        bridgeAmount,
        80_325_000n,
        19_213n,
        cardanoUtxos1.values(),
        {
          protocolParams: protocolParameters,
        },
      );
      // parse the unsigned transaction
      const unsignedTx = wasm.Transaction.from_hex(unsignedHexTx);
      const unsignedTxBody = unsignedTx.body();
      // check number of outputs
      expect(unsignedTxBody.outputs().len()).toEqual(3);
      // extract tx fee
      const feeValue = BigInt(unsignedTxBody.fee().to_js_value());
      // check lockBox address and value
      const lockBox = unsignedTxBody.outputs().get(0);
      expect(lockBox.address().to_bech32()).toEqual(cardanoLockAddress);
      expect(BigInt(lockBox.amount().coin().to_js_value())).toEqual(
        bridgeAmount,
      );
      // check lockBox has no assets
      expect(lockBox.amount().multiasset()).toEqual(undefined);
      // check auxiliary data
      const axillaryData = unsignedTx.auxiliary_data()!.metadata()!;
      expect(parseMetadata(axillaryData)).deep.equal(axillaryDataErgBridge);
      // check fee value
      expect(feeValue).toEqual(185125n);
      // iterate over change boxes, check addresses, accumulate values and assets
      const changeAssets: CardanoAsset[] = [];
      let changeValue = 0n;
      for (let i = 1; i < unsignedTxBody.outputs().len(); i++) {
        expect(unsignedTxBody.outputs().get(i).address().to_bech32()).toEqual(
          fromAddress,
        );
        changeValue += BigInt(
          unsignedTxBody.outputs().get(i).amount().coin().to_js_value(),
        );
        const multiAsset = unsignedTxBody
          .outputs()
          .get(i)
          .amount()
          .multiasset();
        if (multiAsset) {
          Object.entries(multiAsset.to_js_value()).flatMap(
            ([policyId, assets]) =>
              Object.entries(assets).forEach(([assetName, quantity]) =>
                changeAssets.push({
                  policyId,
                  assetName,
                  quantity: BigInt(quantity),
                }),
              ),
          );
        }
      }
      // check total change value and assets
      expect(changeValue).toEqual(4214875n);
      expect(changeAssets).deep.equal(cardanoUtxos1[0].assets);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with token bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate CardanoRosenChainSDK with tokenMap and cardanoLockAddress
     * - set RSN-Pandora token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for RSN-Pandora from Cardano to Ergo
     * - parse the unsigned transaction
     * - extract lockBox and feeValue
     * - check number of outputs
     * - check lockBox address and value
     * - check lockBox has correct token and amount
     * - check auxiliary data
     * - check fee value
     * - iterate over change boxes, check addresses, accumulate values and assets
     * - check total change value and assets
     * @expected
     * - unsigned transaction should have 3 outputs
     * - lockBox address should match cardanoLockAddress
     * - lockBox value should be equal to expected value
     * - lockBox should have exactly one token with correct id and amount
     * - auxiliary data should match axillaryDataRSNBridge
     * - fee should be equal to expected value
     * - address of change boxes should be equal to proper fromAddress
     * - change boxes should have correct value, and assets
     */
    it(`should generate lock transaction correctly with token bridging`, async () => {
      // instantiate CardanoRosenChainSDK with tokenMap and cardanoLockAddress
      const cardanoRosenChainSDK = new CardanoRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
      );
      // set RSN-Pandora token id, fromAddress, toAddress, and bridgeAmount
      const rpnRSNTokenIdOnCardano =
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e52534e'; // RSN-Pandora
      const fromAddress =
        'addr1q85fh9t2cn7j8g62te545uyayjtlc7cwl9df50dugpe78r5d9z85ctlucfsnmefqrehxuvjw6ws6pzc5rvwyjdl2g8us6pr89f';
      const toAddress = '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W';
      const bridgeAmount = 10_000_000_000n;
      // call generateLockTransaction for RSN-Pandora from Cardano to Ergo
      const unsignedHexTx = await cardanoRosenChainSDK.generateLockTransaction(
        rpnRSNTokenIdOnCardano,
        NETWORKS.ERGO,
        toAddress,
        fromAddress,
        bridgeAmount,
        100_000_000n,
        40_000n,
        cardanoUtxos2.values(),
        {
          protocolParams: protocolParameters,
        },
      );
      // parse the unsigned transaction
      const unsignedTx = wasm.Transaction.from_hex(unsignedHexTx);
      const unsignedTxBody = unsignedTx.body();
      // extract lockBox and feeValue
      const lockBox = unsignedTxBody.outputs().get(0);
      const feeValue = BigInt(unsignedTxBody.fee().to_js_value());
      // check number of outputs
      expect(unsignedTxBody.outputs().len()).toEqual(3);
      // check lockBox address and value
      expect(lockBox.address().to_bech32()).toEqual(cardanoLockAddress);
      expect(BigInt(lockBox.amount().coin().to_js_value())).toEqual(1060260n);
      // check lockBox has correct token and amount
      expect(lockBox.amount().multiasset()!.len()).toEqual(1);
      Object.entries(lockBox.amount().multiasset()!.to_js_value()).flatMap(
        ([policyId, assets]) => {
          Object.entries(assets).forEach(([assetName, quantity]) => {
            expect(`${policyId}.${assetName}`).toEqual(rpnRSNTokenIdOnCardano);
            expect(BigInt(quantity)).toEqual(bridgeAmount);
          });
        },
      );
      // check auxiliary data
      const axillaryData = unsignedTx.auxiliary_data()!.metadata()!;
      expect(parseMetadata(axillaryData)).deep.equal(axillaryDataRSNBridge);
      // check fee value
      expect(feeValue).toEqual(187105n);
      // iterate over change boxes, check addresses, accumulate values and assets
      const changeAssets: CardanoAsset[] = [];
      let changesValue = 0n;
      for (let i = 1; i < unsignedTxBody.outputs().len(); i++) {
        expect(unsignedTxBody.outputs().get(i).address().to_bech32()).toEqual(
          fromAddress,
        );
        changesValue += BigInt(
          unsignedTxBody.outputs().get(i).amount().coin().to_js_value(),
        );
        const multiAsset = unsignedTxBody
          .outputs()
          .get(i)
          .amount()
          .multiasset();
        if (multiAsset) {
          Object.entries(multiAsset.to_js_value()).flatMap(
            ([policyId, assets]) =>
              Object.entries(assets).forEach(([assetName, quantity]) =>
                changeAssets.push({
                  policyId,
                  assetName,
                  quantity: BigInt(quantity),
                }),
              ),
          );
        }
      }
      // check total change value and assets
      expect(changesValue).toEqual(5152635n);
      expect(changeAssets).deep.equal([cardanoUtxos2[0].assets[1]]);
    });

    /**
     * @target generateLockTransaction should throw error in case of insufficient assets for bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - instantiate CardanoRosenChainSDK with tokenMap and cardanoLockAddress
     * - set RSN-Pandora token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for RSN-Pandora from Cardano to Ergo with insufficient UTXOs
     * - expect the call to throw InsufficientAssetsException
     * @expected
     * - should throw InsufficientAssetsException in case that utxoIterator doesn't cover `amount`
     */
    it(`should throw error in case of insufficient assets for bridging`, async () => {
      // instantiate CardanoRosenChainSDK with tokenMap and cardanoLockAddress
      const cardanoRosenChainSDK = new CardanoRosenChainSDK(
        tokenMap,
        cardanoLockAddress,
      );
      // set RSN-Pandora token id, fromAddress, toAddress, and bridgeAmount
      const rpnRSNTokenIdOnCardano =
        '57abe42f549784c88f14e78872127d62fc0a7bfbed0ad7d41e5eb2fb.72706e52534e'; // RSN-Pandora
      const fromAddress =
        'addr1q85fh9t2cn7j8g62te545uyayjtlc7cwl9df50dugpe78r5d9z85ctlucfsnmefqrehxuvjw6ws6pzc5rvwyjdl2g8us6pr89f';
      const toAddress = '9hBEAVZ9MHLf7mwVrvP3nqptdqYVdYGu1byPH8XFzC7KDuzrb8W';
      const bridgeAmount = 10_000_000_000n;
      // call generateLockTransaction for RSN-Pandora from Cardano to Ergo with insufficient UTXOs
      const unsignedHexTx = cardanoRosenChainSDK.generateLockTransaction(
        rpnRSNTokenIdOnCardano,
        NETWORKS.ERGO,
        toAddress,
        fromAddress,
        bridgeAmount,
        100_000_000n,
        40_000n,
        cardanoUtxos1.values(),
        {
          protocolParams: protocolParameters,
        },
      );
      // expect the call to throw InsufficientAssetsException
      await expect(unsignedHexTx).rejects.toThrow(InsufficientAssetsException);
    });
  });

  describe(`walletUtxoToCardanoUtxo`, () => {
    /**
     * @target walletUtxoToCardanoUtxo should convert hex serialized TransactionUnspentOutput to CardanoUtxo correctly
     * @scenario
     * - call walletUtxoToCardanoUtxo with a hex serialized TransactionUnspentOutput
     * - compare the result with the expected deserialized CardanoUtxo object
     * @expected
     * - returned CardanoUtxo should deeply equal the expected deserializedTransactionUnspentOutput
     */
    it(`should converts hex serialized of TransactionUnspentOutput to CardanoUtxo correctly`, async () => {
      const utxo = CardanoRosenChainSDK.walletUtxoToCardanoUtxo(
        serializedTransactionUnspentOutput,
      );
      expect(utxo).deep.equal(deserializedTransactionUnspentOutput);
    });
  });
});
