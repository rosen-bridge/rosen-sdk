import { NETWORKS, NETWORKS_INDEX } from '@rosen-bridge/sdk-constant';

/**
 * generates metadata for lock transaction
 * @param toChain
 * @param addressHex
 * @param networkFee
 * @param bridgeFee
 * @returns
 */
export const generateRosenData = (
  toChain: NETWORKS,
  addressHex: string,
  networkFee: bigint,
  bridgeFee: bigint,
): string => {
  const toChainHex = NETWORKS_INDEX[toChain].toString(16).padStart(2, '0');
  // parse bridgeFee
  const bridgeFeeHex = bridgeFee.toString(16).padStart(16, '0');
  // parse networkFee
  const networkFeeHex = networkFee.toString(16).padStart(16, '0');
  // parse toAddress
  const addressLengthCode = (addressHex.length / 2)
    .toString(16)
    .padStart(2, '0');

  return (
    toChainHex + bridgeFeeHex + networkFeeHex + addressLengthCode + addressHex
  );
};
