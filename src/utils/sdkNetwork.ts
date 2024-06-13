import { Network } from "../config/Network";
import { DefaultRosenSDKConfig } from "../config/RosenSDKConfig";

export const SDKNetwork: Network = new Network(
  DefaultRosenSDKConfig.NetworkConfig
);
