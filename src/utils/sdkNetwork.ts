import { Network } from "../config/Network";
import {
  BITCOIN_EXPLORER_URL,
  CARDANO_EXPLORER_URL,
  ERGO_EXPLORER_URL,
} from "../constants/constants";

const DefaultRosenSDKConfig = {
  NetworkConfig: {
    CardanoExplorerAPI: CARDANO_EXPLORER_URL,
    ErgoExplorerAPI: ERGO_EXPLORER_URL,
    BitcoinExplorerAPI: BITCOIN_EXPLORER_URL,
  },
};

export const SDKNetwork: Network = new Network(
  DefaultRosenSDKConfig.NetworkConfig
);
