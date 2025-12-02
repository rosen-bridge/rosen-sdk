import { decodeAddress } from '@rosen-bridge/address-codec';
import { NETWORKS_INDEX } from '@rosen-bridge/sdk-constant';

export type MinimalOnChainRosenData = {
  toChain: string;
  toAddress: string;
  bridgeFee: string;
  networkFee: string;
};

/**
 * extracts rosen data from raw hex data
 * @param rosenDataHex
 */
export const parseRosenData = (
  rosenDataHex: string,
): MinimalOnChainRosenData => {
  // parse toChain
  const toChainHex = rosenDataHex.slice(0, 2);
  const toChainCode = parseInt(toChainHex, 16);
  const toChain = Object.entries(NETWORKS_INDEX).find(
    (chainPair) => chainPair[1] == toChainCode,
  )![0];

  // parse bridgeFee
  const bridgeFeeHex = rosenDataHex.slice(2, 18);
  const bridgeFee = BigInt('0x' + bridgeFeeHex).toString();

  // parse networkFee
  const networkFeeHex = rosenDataHex.slice(18, 34);
  const networkFee = BigInt('0x' + networkFeeHex).toString();

  // parse toAddress
  const addressLengthCode = rosenDataHex.slice(34, 36);
  const addressHex = rosenDataHex.slice(
    36,
    36 + parseInt(addressLengthCode, 16) * 2,
  );
  const toAddress = decodeAddress(toChain, addressHex);

  return {
    toChain,
    toAddress,
    bridgeFee,
    networkFee,
  };
};
