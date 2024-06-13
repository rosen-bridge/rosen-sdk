import {
  BITCOIN_EXPLORER_URL,
  CARDANO_EXPLORER_URL,
  ERGO_EXPLORER_URL,
} from "../constants/constants";

export interface NetworkConfig {
  CardanoExplorerAPI: string;
  ErgoExplorerAPI: string;
  BitcoinExplorerAPI: string;
  // Add more configurations as necessary, specifying optional ones with a '?'.
}

export interface RosenSDKConfig {
  NetworkConfig: NetworkConfig;
}

export const DefaultRosenSDKConfig = {
  NetworkConfig: {
    CardanoExplorerAPI: CARDANO_EXPLORER_URL,
    ErgoExplorerAPI: ERGO_EXPLORER_URL,
    BitcoinExplorerAPI: BITCOIN_EXPLORER_URL,
  },
};
