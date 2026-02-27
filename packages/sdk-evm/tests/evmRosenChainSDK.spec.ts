import { Contract, Transaction } from 'ethers';

import { encodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS } from '@rosen-bridge/sdk-constant';
import { generateRosenData } from '@rosen-bridge/sdk-utils';
import { TokenMap } from '@rosen-bridge/tokens';

import { transferABI } from '../lib/constants';
import {
  ergoAddress,
  ethLockAddress,
  rosenTokens,
  userAddress,
} from './testData';
import TestRosenChainSDK from './testRosenChainSDK';

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
      const toAddress = ergoAddress;
      const fromAddress = userAddress;
      const unwrappedAmount = 1000000000000000000n;
      const unwrappedNetworkFee = 100000n;
      const unwrappedBridgeFee = 200000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);
      // call generateLockTransaction for native token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );
      // parse the unsigned transaction
      const { from, ...txWithoutFrom } = unsignedHexTx;
      const unsignedTx = Transaction.from(txWithoutFrom);

      const wrappedBridgeFee = tokenMap.wrapAmount(
        ethTokenIdOnEthereum,
        unwrappedBridgeFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const wrappedNetworkFee = tokenMap.wrapAmount(
        ethTokenIdOnEthereum,
        unwrappedNetworkFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const rosenData = generateRosenData(
        NETWORKS.ERGO,
        toEncodedAddress,
        wrappedNetworkFee,
        wrappedBridgeFee,
      );

      // check `to` and `value` and `from`
      expect(unsignedTx.to?.toLowerCase()).toEqual(ethLockAddress);
      expect(unsignedTx.value).toEqual(unwrappedAmount);
      expect(from).toEqual(fromAddress);
      // check data
      expect(unsignedTx.data).toEqual(`0x${rosenData}`);
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
      const toAddress = ergoAddress;
      const fromAddress = '';
      const unwrappedAmount = 1000000000000000000n;
      const unwrappedNetworkFee = 100000n;
      const unwrappedBridgeFee = 200000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);
      // call generateLockTransaction for native token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        ethTokenIdOnEthereum,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );

      const unsignedTx = Transaction.from(unsignedHexTx);

      const wrappedBridgeFee = tokenMap.wrapAmount(
        ethTokenIdOnEthereum,
        unwrappedBridgeFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const wrappedNetworkFee = tokenMap.wrapAmount(
        ethTokenIdOnEthereum,
        unwrappedNetworkFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const rosenData = generateRosenData(
        NETWORKS.ERGO,
        toEncodedAddress,
        wrappedNetworkFee,
        wrappedBridgeFee,
      );

      // check `to` and `value`
      expect(unsignedTx.to?.toLowerCase()).toEqual(ethLockAddress);
      expect(unsignedTx.value).toEqual(unwrappedAmount);
      expect(unsignedTx.data).toEqual(`0x${rosenData}`);

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
     * - unsigned transaction should have correct `to` and `data`
     * - unsigned transaction value should be zero
     */
    it(`should generate lock transaction correctly with token bridging`, async () => {
      // instantiate EvmRosenChainSDK with tokenMap and ethLockAddress
      const evmRosenChainSDK = new TestRosenChainSDK(tokenMap, ethLockAddress);
      // set token id, fromAddress, toAddress, and bridgeAmount
      const rsnTokenIdOnEthereum = '0xd56a632afd90e68a4b3147720b1b4e974bca82ad';
      const toAddress = ergoAddress;
      const fromAddress = userAddress;
      const unwrappedAmount = 1_000_000n;
      const unwrappedNetworkFee = 100_000n;
      const unwrappedBridgeFee = 200_000n;
      const toEncodedAddress = encodeAddress(NETWORKS.ERGO, toAddress);
      // call generateLockTransaction for the token from EVM to Ergo
      const unsignedHexTx = await evmRosenChainSDK.generateLockTransaction(
        rsnTokenIdOnEthereum,
        NETWORKS.ERGO,
        toEncodedAddress,
        fromAddress,
        unwrappedAmount,
        unwrappedBridgeFee,
        unwrappedNetworkFee,
      );
      // parse the unsigned transaction

      const { from, ...txWithoutFrom } = unsignedHexTx;
      const unsignedTx = Transaction.from(txWithoutFrom);
      const contract = new Contract(rsnTokenIdOnEthereum, transferABI);
      const transferData = contract.interface.encodeFunctionData('transfer', [
        ethLockAddress,
        unwrappedAmount.toString(),
      ]);

      const wrappedBridgeFee = tokenMap.wrapAmount(
        rsnTokenIdOnEthereum,
        unwrappedBridgeFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const wrappedNetworkFee = tokenMap.wrapAmount(
        rsnTokenIdOnEthereum,
        unwrappedNetworkFee,
        NETWORKS.ETHEREUM,
      ).amount;
      const rosenData = generateRosenData(
        NETWORKS.ERGO,
        toEncodedAddress,
        wrappedNetworkFee,
        wrappedBridgeFee,
      );
      // check `to`
      expect(unsignedTx.to?.toLowerCase()).toEqual(rsnTokenIdOnEthereum);
      // check value
      expect(unsignedTx.value).toEqual(0n);
      // check from
      expect(from).toEqual(fromAddress);
      // check data
      expect(unsignedTx.data).toEqual(`${transferData}${rosenData}`);
    });
  });
});
