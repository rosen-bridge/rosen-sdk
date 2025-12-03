import { encodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS } from '@rosen-bridge/sdk-constant';

import { generateRosenData } from '../lib';
import { encodedRosenTestData, rosenTestDataBridge } from './testData';

describe(`generateRosenData`, () => {
  /**
   * @target generateLockTransaction should generate rosen data correctly
   * @dependencies
   * @scenario
   * - encode toChainAddress into hex string
   * @expected
   * generate rosen data correctly
   */
  it(`should generate rosen data correctly`, async () => {
    const toChain = NETWORKS.ERGO;
    const toEncodedAddress = encodeAddress(
      toChain,
      rosenTestDataBridge.toAddress,
    );
    const hex = generateRosenData(
      rosenTestDataBridge.toChain as NETWORKS,
      toEncodedAddress,
      rosenTestDataBridge.networkFee,
      rosenTestDataBridge.bridgeFee,
    );
    expect(hex).toEqual(encodedRosenTestData);
  });
});
