import { Psbt } from 'bitcoinjs-lib';

import { encodeAddress } from '@rosen-bridge/address-codec';
import { InsufficientAssetsException } from '@rosen-bridge/sdk-abstract';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import { DOGE_NETWORK, DogecoinRosenChainSDK } from '../lib';
import {
  MissingNonWitnessUtxoError,
  UnsupportedTokenException,
} from '../lib/errors';
import {
  rosenTokens,
  rosenDataDogeBridge,
  dogecoinLockAddress,
  txToHex,
  dogecoinUtxos,
} from './testData';
import { parseRosenData } from './utils';

describe(`DogecoinRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(rosenTokens);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with Doge bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate DogecoinRosenChainSDK with tokenMap and dogecoinLockAddress
     * - Set doge token id, fromAddress, toChain, toEncodedAddress, and bridgeAmount
     * - Call generateLockTransaction for Doge from Dogecoin to Ergo
     * - Parse the unsigned transaction using Psbt
     * - Check the returned value
     * @expected
     * - unsigned transaction should have 3 outputs
     * - lockBox address should match dogecoinLockAddress
     * - lockBox value should match bridgeAmount
     * - OP_RETURN output should contain correct rosen data
     * - changeBox address should match fromAddress
     * - changeBox value should match expected value
     */
    it(`should generate lock transaction correctly with DOGE bridging`, async () => {
      // instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
      const dogecoinRosenChainSDK = new DogecoinRosenChainSDK(
        tokenMap,
        dogecoinLockAddress,
      );
      // set doge token id, fromAddress, toEncodedAddress, and bridgeAmount
      const dogeTokenIdOnDogecoin = 'doge';
      const fromAddress = 'DJMddFEP76kdE93WMez62AYUxqx8XoD3yb';
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataDogeBridge.toAddress,
      );
      const bridgeAmount = 3_000_000_000n;
      // call generateLockTransaction for doge from Dogecoin to Ergo
      const unsignedHexTx = await dogecoinRosenChainSDK.generateLockTransaction(
        dogeTokenIdOnDogecoin,
        toChain,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        250_000_000n,
        200_000_000n,
        dogecoinUtxos.values(),
        {
          feeRatio: 216206.035,
          txToHex,
        },
      );
      const psbt = Psbt.fromBase64(unsignedHexTx.psbt.base64, {
        network: DOGE_NETWORK,
      });
      // check number of outputs
      expect(psbt.txOutputs.length).toEqual(3);
      // check lockBox address and value
      const lockBox = psbt.txOutputs[1];
      expect(lockBox.address).toEqual(dogecoinLockAddress);
      expect(BigInt(lockBox.value)).toEqual(bridgeAmount);
      // check rosen data
      expect(psbt.txOutputs[0].script.toString('hex')).toMatch(/^6a/);
      const opReturnData = psbt.txOutputs[0].script.toString('hex').slice(4);
      expect(parseRosenData(opReturnData)).toMatchObject(rosenDataDogeBridge);
      const changeBox = psbt.txOutputs[2];
      expect(changeBox.address).toEqual(fromAddress);
      expect(changeBox.value).toEqual(9_499_481_746);
    });

    /**
     * @target generateLockTransaction should throw error in case of bridging something other than doge
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
     * - Set an unsupported token id, fromAddress, toEncodedAddress, and bridgeAmount
     * - Call generateLockTransaction for unsupported token from Dogecoin to Ergo
     * @expected
     * - Should throw UnsupportedTokenException
     */
    it(`should throw error in case of bridging something other than doge`, async () => {
      // instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
      const dogecoinRosenChainSDK = new DogecoinRosenChainSDK(
        tokenMap,
        dogecoinLockAddress,
      );
      // set unknown-token token id, fromAddress, toEncodedAddress, and bridgeAmount
      const unknownTokenIdOnDogecoin = 'unknown-token';
      const fromAddress = 'bc1...';
      const toEncodedAddress = 'abc123...';
      const bridgeAmount = 1_500_000n;
      // call generateLockTransaction for doge from Dogecoin to Ergo
      const unsignedHexTx = dogecoinRosenChainSDK.generateLockTransaction(
        unknownTokenIdOnDogecoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        dogecoinUtxos.values(),
        {
          feeRatio: 216206.035,
          txToHex,
        },
      );

      // expect the call to throw UnsupportedTokenException
      await expect(unsignedHexTx).rejects.toThrow(UnsupportedTokenException);
    });

    /**
     * @target generateLockTransaction should throw error in case of missing hex of tx for utxos
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
     * - Set doge token id, toEncodedAddress, and bridgeAmount
     * - set dogeUtxos with a txId that does not exist in txToHex
     * - Call generateLockTransaction from Dogecoin to Ergo
     * @expected
     * - Should throw MissingNonWitnessUtxoError
     */
    it(`should throw error in case of missing hex of tx for utxos`, async () => {
      // instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
      const dogecoinRosenChainSDK = new DogecoinRosenChainSDK(
        tokenMap,
        dogecoinLockAddress,
      );
      // set doge token id, fromAddress, toEncodedAddress, and bridgeAmount
      const dogeTokenIdOnDogecoin = 'doge';
      const fromAddress = 'DJMddFEP76kdE93WMez62AYUxqx8XoD3yb';
      const toEncodedAddress = '12abc...';
      const bridgeAmount = 1_500_000n;
      // call generateLockTransaction for Doge from Dogecoin to Ergo
      const unsignedHexTx = dogecoinRosenChainSDK.generateLockTransaction(
        dogeTokenIdOnDogecoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        dogecoinUtxos.values(),
        {
          feeRatio: 216206.035,
          txToHex: {},
        },
      );

      // expect the call to throw MissingNonWitnessUtxoError
      await expect(unsignedHexTx).rejects.toThrow(MissingNonWitnessUtxoError);
    });

    /**
     * @target generateLockTransaction should throw error in case of insufficient assets for bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - Instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
     * - Set Doge token id, fromAddress, toEncodedAddress, and a bridgeAmount greater than available UTXOs
     * - Call generateLockTransaction for Doge from Dogecoin to Ergo
     * @expected
     * - Should throw InsufficientAssetsException if utxoIterator does not cover the requested amount
     */
    it(`should throw error in case of insufficient assets for bridging`, async () => {
      // instantiate DogecoinRosenChainSDK with tokenMap and dogeLockAddress
      const dogecoinRosenChainSDK = new DogecoinRosenChainSDK(
        tokenMap,
        dogecoinLockAddress,
      );
      // set Doge token id, fromAddress, toEncodedAddress, and bridgeAmount
      const dogeTokenIdOnDogecoin = 'doge';
      const fromAddress = 'DJMddFEP76kdE93WMez62AYUxqx8XoD3yb';
      const toChain = NETWORKS.ERGO;
      const toEncodedAddress = encodeAddress(
        toChain,
        rosenDataDogeBridge.toAddress,
      );
      const bridgeAmount = 1_500_000_000_000n;
      // call generateLockTransaction for Doge from Dogecoin to Ergo
      const unsignedHexTx = dogecoinRosenChainSDK.generateLockTransaction(
        dogeTokenIdOnDogecoin,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        bridgeAmount,
        9551n,
        153n,
        dogecoinUtxos.values(),
        {
          feeRatio: 216206.035,
          txToHex,
        },
      );
      // expect the call to throw InsufficientAssetsException
      await expect(unsignedHexTx).rejects.toThrow(InsufficientAssetsException);
    });
  });
});
