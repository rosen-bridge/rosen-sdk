import { Psbt } from 'bitcoinjs-lib';

import { encodeAddress } from '@rosen-bridge/address-codec';
import { InsufficientAssetsException } from '@rosen-bridge/sdk-abstract';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { BitcoinRosenChainSDK } from '../lib';
import {
  UnsupportedSourceAddress,
  UnsupportedTokenException,
} from '../lib/errors';
import {
  rosenTokens,
  bitcoinLockAddress,
  bitcoinUtxos,
  rosenDataBtcBridge,
} from './testData';
import { parseRosenData } from './utils';

describe(`BitcoinRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(rosenTokens);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with BTC bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
     * - Set BTC token id, fromAddress, toChain, toEncodedAddress, and bridgeAmount
     * - Call generateLockTransaction for BTC from Bitcoin to Ergo
     * - Parse the unsigned transaction using Psbt
     * - Check number of outputs (should be 3)
     * - Check lockBox address and value (should match bitcoinLockAddress and bridgeAmount)
     * - Check OP_RETURN output for correct rosen data
     * - Check changeBox address and value (should match fromAddress and expected value)
     * @expected
     * - unsigned transaction should have 3 outputs
     * - lockBox address should match bitcoinLockAddress
     * - lockBox value should match bridgeAmount
     * - OP_RETURN output should contain correct rosen data
     * - changeBox address should match fromAddress
     * - changeBox value should match expected value
     */
    it(`should generate lock transaction correctly with BTC bridging`, async () => {
      // instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
      const bitcoinRosenChainSDK = new BitcoinRosenChainSDK(
        tokenMap,
        bitcoinLockAddress,
      );
      // set BTC token id, fromAddress, toEncodedAddress, and bridgeAmount
      const btcTokenIdOnBitcoin = 'btc';
      const fromAddress = 'bc1q2jy0ck7hjwp2m4c02hwph54lxt2cxs30u4670v';
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataBtcBridge.toAddress,
      );
      const bridgeAmount = 1_500_000n;
      // call generateLockTransaction for BTC from Bitcoin to Ergo
      const unsignedHexTx = await bitcoinRosenChainSDK.generateLockTransaction(
        btcTokenIdOnBitcoin,
        toChain,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        bitcoinUtxos.values(),
        {
          feeRatio: 4.968,
        },
      );
      const psbt = Psbt.fromBase64(unsignedHexTx.psbt.base64);
      // check number of outputs
      expect(psbt.txOutputs.length).toEqual(3);
      // check lockBox address and value
      const lockBox = psbt.txOutputs[1];
      expect(lockBox.address).toEqual(bitcoinLockAddress);
      expect(BigInt(lockBox.value)).toEqual(bridgeAmount);
      // check rosen data
      expect(psbt.txOutputs[0].script.toString('hex')).toMatch(/^6a/);
      const opReturnData = psbt.txOutputs[0].script.toString('hex').slice(4);
      expect(parseRosenData(opReturnData)).toMatchObject(rosenDataBtcBridge);
      const changeBox = psbt.txOutputs[2];
      expect(changeBox.address).toEqual(fromAddress);
      expect(changeBox.value).toEqual(1498993);
    });

    /**
     * @target generateLockTransaction should throw error in case of bridging something other than btc
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
     * - Set an unsupported token id, fromAddress, toEncodedAddress, and bridgeAmount
     * - Call generateLockTransaction for unsupported token from Bitcoin to Ergo
     * @expected
     * - Should throw UnsupportedTokenException
     */
    it(`should throw error in case of bridging something other than btc`, async () => {
      // instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
      const bitcoinRosenChainSDK = new BitcoinRosenChainSDK(
        tokenMap,
        bitcoinLockAddress,
      );
      // set BTC token id, fromAddress, toEncodedAddress, and bridgeAmount
      const unknownTokenIdOnBitcoin = 'unknown-token';
      const fromAddress = 'bc1...';
      const toEncodedAddress = 'abc123...';
      const bridgeAmount = 1_500_000n;
      // call generateLockTransaction for BTC from Bitcoin to Ergo
      const unsignedHexTx = bitcoinRosenChainSDK.generateLockTransaction(
        unknownTokenIdOnBitcoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        bitcoinUtxos.values(),
        {
          feeRatio: 4.968,
        },
      );

      // expect the call to throw UnsupportedTokenException
      await expect(unsignedHexTx).rejects.toThrow(UnsupportedTokenException);
    });

    /**
     * @target generateLockTransaction should throw error in case of using non native-segwit address
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
     * - Set an `unsupported fromAddress`, token id, toEncodedAddress, and bridgeAmount
     * - Call generateLockTransaction for unsupported fromAddress from Bitcoin to Ergo
     * @expected
     * - Should throw UnsupportedSourceAddress
     */
    it(`should throw error in case of using non native-segwit address`, async () => {
      // instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
      const bitcoinRosenChainSDK = new BitcoinRosenChainSDK(
        tokenMap,
        bitcoinLockAddress,
      );
      // set BTC token id, fromAddress, toEncodedAddress, and bridgeAmount
      const btcTokenIdOnBitcoin = 'btc';
      const fromAddress =
        'bc1ppsey88z8jf7ag40yhfs8t63kcd5u6pwavk2aqzfxhaya7wsykn0s3mfgyq';
      const toEncodedAddress = '12abc...';
      const bridgeAmount = 1_500_000n;
      // call generateLockTransaction for BTC from Bitcoin to Ergo
      const unsignedHexTx = bitcoinRosenChainSDK.generateLockTransaction(
        btcTokenIdOnBitcoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        bitcoinUtxos.values(),
        {
          feeRatio: 4.968,
        },
      );

      // expect the call to throw UnsupportedSourceAddress
      await expect(unsignedHexTx).rejects.toThrow(UnsupportedSourceAddress);
    });

    /**
     * @target generateLockTransaction should throw error in case of insufficient assets for bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
     * - Set BTC token id, fromAddress, toEncodedAddress, and a bridgeAmount greater than available UTXOs
     * - Call generateLockTransaction for BTC from Bitcoin to Ergo
     * @expected
     * - Should throw InsufficientAssetsException if utxoIterator does not cover the requested amount
     */
    it(`should throw error in case of insufficient assets for bridging`, async () => {
      // instantiate BitcoinRosenChainSDK with tokenMap and bitcoinLockAddress
      const bitcoinRosenChainSDK = new BitcoinRosenChainSDK(
        tokenMap,
        bitcoinLockAddress,
      );
      // set BTC token id, fromAddress, toEncodedAddress, and bridgeAmount
      const btcTokenIdOnBitcoin = 'btc';
      const fromAddress = 'bc1q2jy0ck7hjwp2m4c02hwph54lxt2cxs30u4670v';
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataBtcBridge.toAddress,
      );
      const bridgeAmount = 1_500_000_000n;
      // call generateLockTransaction for BTC from Bitcoin to Ergo
      const unsignedHexTx = bitcoinRosenChainSDK.generateLockTransaction(
        btcTokenIdOnBitcoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        bitcoinUtxos.values(),
        {
          feeRatio: 4.968,
        },
      );
      // expect the call to throw InsufficientAssetsException
      await expect(unsignedHexTx).rejects.toThrow(InsufficientAssetsException);
    });
  });
});
