import {
  BITCOIN_EXPLORER_URL,
  CARDANO_EXPLORER_URL,
  ERGO_EXPLORER_URL,
} from "../src/constants/constants";

export const testRSNRatioNFT =
  "05690d3e7a8daae13495b32af8ab58aaec8a5435f5974f6adf17095d28cac1f5";

export const LoenRosenSDKConfig = {
  NetworkConfig: {
    CardanoExplorerAPI: CARDANO_EXPLORER_URL,
    ErgoExplorerAPI: ERGO_EXPLORER_URL,
    BitcoinExplorerAPI: BITCOIN_EXPLORER_URL,
  },
};
