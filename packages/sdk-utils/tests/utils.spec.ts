import { encodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS } from '@rosen-bridge/sdk-constant';

import { generateRosenData } from '../lib';
import { rosenTestDataBridge } from './testData';
import { parseRosenData } from './utils';

describe(`generateRosenData`, () => {
  /**
   * @target generateLockTransaction should generate rosen data correctly
   * @dependencies
   * @scenario
   * - encode toChainAddress into hex string
   * @expected
   */
  it(`should generate rosen data correctly`, async () => {
    const toChain = NETWORKS.ERGO;
    const toEncodedAddress = encodeAddress(
      toChain,
      rosenTestDataBridge.toAddress,
    );
    const hex = generateRosenData(toChain, toEncodedAddress, 153n, 9551n);
    expect(parseRosenData(hex)).toEqual(rosenTestDataBridge);
  });
});
