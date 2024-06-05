import {
  BITCOIN_EXPLORER_URL,
  CARDANO_EXPLORER_URL,
  ERGO_EXPLORER_URL,
  FEE_CONFIG_TOKEN_ID,
  LOEN_FEE_CONFIG_TOKEN_ID,
} from "../constants/constants";

export interface NetworkConfig {
  CardanoExplorerAPI: string;
  ErgoExplorerAPI: string;
  BitcoinExplorerAPI: string;
  // Add more configurations as necessary, specifying optional ones with a '?'.
}

export interface RosenSDKConfig {
  NetworkConfig: NetworkConfig;
  FeeConfigTokenId: string;
}

export const LoenRosenSDKConfig = {
  NetworkConfig: {
    CardanoExplorerAPI: CARDANO_EXPLORER_URL,
    ErgoExplorerAPI: ERGO_EXPLORER_URL,
    BitcoinExplorerAPI: BITCOIN_EXPLORER_URL,
  },
  FeeConfigTokenId: LOEN_FEE_CONFIG_TOKEN_ID,
};

export const DefaultRosenSDKConfig = {
  NetworkConfig: {
    CardanoExplorerAPI: CARDANO_EXPLORER_URL,
    ErgoExplorerAPI: ERGO_EXPLORER_URL,
    BitcoinExplorerAPI: BITCOIN_EXPLORER_URL,
  },
  FeeConfigTokenId: FEE_CONFIG_TOKEN_ID,
};
