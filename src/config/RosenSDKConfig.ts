export interface NetworkConfig {
  CardanoExplorerAPI: string;
  ErgoExplorerAPI: string;
  BitcoinExplorerAPI: string;
  // Add more configurations as necessary, specifying optional ones with a '?'.
}

export interface RosenSDKConfig {
  NetworkConfig: NetworkConfig;
}
