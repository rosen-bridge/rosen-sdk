import { Transaction } from 'ethers';

import { encodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { TokenMap } from '@rosen-bridge/tokens';

import {
  ergoAddress,
  ethLockAddress,
  rosenDataETHBridge,
  rosenDataRpnRSNBridge,
  rosenTokens,
  userAddress,
} from './testData';
import TestRosenChainSDK from './testRosenChainSDK';
import { parseRosenData } from './utils';

describe(`EvmRosenChainSDK`, () => {
  describe(`generateLockTransaction`, () => {
    let tokenMap: TokenMap;
    beforeEach(async () => {
      tokenMap = new TokenMap();
      await tokenMap.updateConfigByJson(rosenTokens);
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with native token bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - initialize EvmRosenChainSDK with tokenMap and ethLockAddress
     * - set native token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for native token from EVM to Ergo
     * - parse the unsigned transaction
     * - Check the returned value
     * @expected
     * - unsigned transaction should have correct `to` and `value`
     * - unsigned transaction data should be correctly generated
     */
    it(`should generate lock transaction correctly with native token bridging`, async () => {
      // instantiate EvmRosenChainSDK with tokenMap and ethLockAddress
      const evmRosenChainSDK = new TestRosenChainSDK(tokenMap, ethLockAddress);
      // set native token id, fromAddress, toAddress, and bridgeAmount
      const ethTokenIdOnEthereum = 'eth';
      const toChain = NETWORKS.ERGO;
      const toAddress = ergoAddress;
      const fromAddress = userAddress;
      const unwrappedAmount = 1000000000000000000n;
      const unwrappedNetworkFee = 100000n;
      const unwrappedBridgeFee = 200000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);
      // call generateLockTransaction for native token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        toChain,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );
      // parse the unsigned transaction
      const { from, ...txWithoutFrom } = unsignedHexTx;
      const unsignedTx = Transaction.from(txWithoutFrom);

      const rosenData = parseRosenData(unsignedTx.data.substring(2));

      // check `to` and `value` and `from`
      expect(unsignedTx.to?.toLowerCase()).toEqual(ethLockAddress);
      expect(unsignedTx.value).toEqual(unwrappedAmount);
      expect(from).toEqual(fromAddress);
      // check data
      expect(rosenData).toMatchObject(rosenDataETHBridge);
    });

    /**
     * @target generateLockTransaction should generate lock transaction without `from` field when fromAddress is empty string
     * @dependencies
     * - TokenMap
     * @scenario
     * - initialize EvmRosenChainSDK with tokenMap and ethLockAddress
     * - set native token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for native token from EVM to Ergo
     * - Check the returned value
     * @expected
     * - unsigned transaction should have correct `to` and `value`
     * - unsigned transaction should not have `from` field
     */
    it(`should generate lock transaction without 'from' field when fromAddress is empty string`, async () => {
      // instantiate EvmRosenChainSDK with tokenMap and ethLockAddress
      const evmRosenChainSDK = new TestRosenChainSDK(tokenMap, ethLockAddress);
      // set native token id, fromAddress, toAddress, and bridgeAmount
      const ethTokenIdOnEthereum = 'eth';
      const toChain = NETWORKS.ERGO;
      const toAddress = ergoAddress;
      const fromAddress = '';
      const unwrappedAmount = 1000000000000000000n;
      const unwrappedNetworkFee = 100000n;
      const unwrappedBridgeFee = 200000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);
      // call generateLockTransaction for native token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        toChain,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );

      const unsignedTx = Transaction.from(unsignedHexTx);

      const rosenData = parseRosenData(unsignedTx.data.substring(2));

      // check `to` and `value`
      expect(unsignedTx.to?.toLowerCase()).toEqual(ethLockAddress);
      expect(unsignedTx.value).toEqual(unwrappedAmount);
      expect(rosenData).toMatchObject(rosenDataETHBridge);

      // check `from`
      expect(unsignedHexTx.from).toBeUndefined();
    });

    /**
     * @target generateLockTransaction should generate lock transaction correctly with token bridging
     * @dependencies
     * - TokenMap
     * @scenario
     * - initialize EvmRosenChainSDK with tokenMap and ethLockAddress
     * - set token id, fromAddress, toAddress, and bridgeAmount
     * - call generateLockTransaction for the token from EVM to Ergo
     * - parse the unsigned transaction
     * - Check the returned value
     * @expected
     * - unsigned transaction value should be zero
     * - unsigned transaction should have correct `to`, `transferredData` and `rosenData`
     */
    it(`should generate lock transaction correctly with token bridging`, async () => {
      // instantiate EvmRosenChainSDK with tokenMap and ethLockAddress
      const evmRosenChainSDK = new TestRosenChainSDK(tokenMap, ethLockAddress);
      // set token id, fromAddress, toAddress, and bridgeAmount
      const rsnTokenIdOnEthereum = '0xd56a632afd90e68a4b3147720b1b4e974bca82ad';
      const toChain = NETWORKS.ERGO;
      const toAddress = ergoAddress;
      const fromAddress = userAddress;
      const unwrappedAmount = 1_000_000n;
      const unwrappedNetworkFee = 100_000n;
      const unwrappedBridgeFee = 200_000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);

      // call generateLockTransaction for the token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        rsnTokenIdOnEthereum,
        toChain,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );

      // parse the unsigned transaction
      const { from, ...txWithoutFrom } = unsignedHexTx;
      const unsignedTx = Transaction.from(txWithoutFrom);

      // ERC20 transfer:
      // 1. bytes from 5 to 37 must be the lock address
      // 2. bytes from 37 to 69 show the amount
      // 3. bytes after 69 must represent a valid CallDataRosenData
      const callData = unsignedTx.data.substring(2);
      const lockAddress = BigInt('0x' + callData.substring(8, 72)).toString(16);
      const assetAmount = BigInt('0x' + callData.slice(72, 72 + 64));
      const rosenData = parseRosenData(callData.substring(72 + 64));

      // check eth value
      expect(unsignedTx.value).toEqual(0n);
      // check `to` (should be erc20 contract)
      expect(unsignedTx.to?.toLowerCase()).toEqual(rsnTokenIdOnEthereum);
      // check `destination address` (should be lock address)
      expect(lockAddress).toEqual(ethLockAddress.substring(2));
      // check asset amount
      expect(assetAmount).toEqual(unwrappedAmount);
      // check from
      expect(from).toEqual(fromAddress);
      // check data
      expect(rosenData).toEqual(rosenDataRpnRSNBridge);
    });
  });
});
