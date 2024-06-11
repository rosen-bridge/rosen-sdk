import {
  CARDANO_BASE_TX_URL,
  ERGO_BASE_TX_URL,
  Networks,
} from "../constants/constants";

/**
 * Returns the base transaction URL for a given blockchain network.
 *
 * @param chain - The blockchain network for which to get the base transaction URL.
 * @returns The base transaction URL as a string.
 */
export const baseTxUrl = (chain: keyof typeof Networks): string => {
  switch (chain) {
    case Networks.ergo:
      return ERGO_BASE_TX_URL;
    case Networks.cardano:
      return CARDANO_BASE_TX_URL;
    case Networks.bitcoin:
      // Add bitcoin base tx url
      return "";
    default:
      return "";
  }
};
