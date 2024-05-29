import { TokenMap, RosenTokens, RosenChainToken } from "@rosen-bridge/tokens";
import { BridgeMinimumFee } from "@rosen-bridge/minimum-fee";
import { Networks } from "../constants/constants";
import {
  DefaultRosenSDKConfig,
  RosenSDKConfig,
} from "../config/RosenSDKConfig";
import { Network } from "../config/Network";
import { BigIntMath } from "../utils/bigintmath";
import {
  ChainNotSupportedException,
  FeeRetrievalFailureException,
  TokenNotFoundException,
} from "../errors";

export class Fees {
  bridgeFee: bigint;
  networkFee: bigint;

  constructor(bridgeFee: bigint, networkFee: bigint) {
    this.bridgeFee = bridgeFee;
    this.networkFee = networkFee;
  }
}

export interface IRosenUserInterface {
  tokenMap: TokenMap;
  minimumFeeNFT: string;
  minimumFeeAddress: string;

  /**
   * @returns list of supported chains
   */
  getSupportedChains: () => Array<string>;

  /**
   * gets details of all supported tokens on a chain
   * @param chain
   * @returns the list of supported tokens
   */
  getChainSupportedTokens: (chain: string) => Array<RosenChainToken>;

  /**
   * gets list of chains that supports a token
   * @param chain
   * @param tokenId token id on the given chain
   * @returns the list of chains that support
   */
  getAvailableChainsForToken: (chain: string, tokenId: string) => Array<string>;

  /**
   * gets details of an token on a chain
   * @param chain
   * @param tokenId token id on the given chain
   * @param targetChain
   * @returns the token details
   */
  getTokenDetailsOnTargetChain: (
    chain: string,
    tokenId: string,
    targetChain: string
  ) => RosenChainToken | null;

  /**
   * calculates the minimum allowed transfer for a token based
   * on minimum bridge fee and network fee on a specific height
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @returns the minimum allowed transfer
   */
  getMinimumTransferAmountForToken: (
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    height: number
  ) => Promise<bigint>;

  /**
   * gets list of chains that supports a token
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @param amount transfer amount
   * @param recommendedNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getAssetNetworkFee` function of toChain)
   * @returns the bridge and network fee
   */
  getFeeByTransferAmount: (
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    amount: bigint,
    recommendedNetworkFee: bigint,
    height: number
  ) => Promise<Fees>;
}

export class RosenUserInterface implements IRosenUserInterface {
  tokenMap: TokenMap;
  minimumFeeNFT: string;
  minimumFeeAddress: string;
  private config: RosenSDKConfig;
  private network: Network;

  constructor(
    tokens: RosenTokens,
    minimumFeeNFT: string,
    minimumFeeAddress: string,
    config: RosenSDKConfig = DefaultRosenSDKConfig
  ) {
    this.tokenMap = new TokenMap(tokens);
    this.minimumFeeAddress = minimumFeeAddress;
    this.minimumFeeNFT = minimumFeeNFT;
    this.config = config;
    this.network = new Network(config.NetworkConfig);
  }

  /**
   * @returns list of supported chains
   */
  getSupportedChains(): Array<string> {
    const networks: Array<string> = [];

    for (const key in Networks) {
      networks.push(key);
    }

    return networks;
  }

  /**
   * Gets details of all supported tokens on a chain
   *
   * Different tokens can exists on different chains. For example,
   * on BTC, the only token that can exist on it is BTC. However,
   * on Ergo, there may exists tokens like, ergo, comet, rsAda,
   * rsBtc. This API provides the tokens that are supported on
   * the very chain itself.
   * @param chain
   * @returns the list of supported tokens
   */
  getChainSupportedTokens(chain: string): Array<RosenChainToken> {
    return this.tokenMap.search(chain, {}).map((obj) => obj[chain]);
  }

  /**
   * Gets list of chains that supports a token
   * @param chain
   * @param tokenId token id on the given chain
   * @returns the list of chains that support
   */
  getAvailableChainsForToken(chain: string, tokenId: string): Array<string> {
    // 1. Get the RosenChainToken
    const tokens = this.tokenMap.search(chain, { tokenId: tokenId });

    if (tokens.length <= 0) {
      throw new TokenNotFoundException();
    }

    const chains = [];
    for (const key in tokens[0]) chains.push(key);

    return chains;
  }

  /**
   * gets details of a token on a chain
   * @param chain
   * @param tokenId token id on the given chain
   * @param targetChain
   * @returns the token details
   */
  getTokenDetailsOnTargetChain(
    chain: string,
    tokenId: string,
    targetChain: string
  ): RosenChainToken {
    const tokensInChain = this.tokenMap.search(chain, { tokenId: tokenId });

    if (tokensInChain.length <= 0) {
      throw new TokenNotFoundException();
    }

    const chains = tokensInChain[0];
    const destChainToken = chains[targetChain];

    return destChainToken;
  }

  /**
   * calculates the minimum allowed transfer for a token based
   * on minimum bridge fee and network fee on a specific height
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @returns the minimum allowed transfer
   */
  async getMinimumTransferAmountForToken(
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    height: number = -1
  ): Promise<bigint> {
    const tokenIdOnErgo = this.checkTokenSupported(fromChain, tokenId, toChain);

    const explorerUrl = this.network.GetExplorerUrl("ergo");

    const minimumFee = new BridgeMinimumFee(
      explorerUrl,
      this.config.FeeConfigTokenId
    );

    try {
      var networkHeightForUse = 0;
      if (height === -1) {
        networkHeightForUse = await this.network.GetHeight(fromChain);
      } else {
        networkHeightForUse = height;
      }

      const fees = await minimumFee.getFee(
        tokenIdOnErgo,
        fromChain,
        networkHeightForUse
      );
      const minimumFees: bigint =
        BigInt(fees.bridgeFee) + BigInt(fees.networkFee);
      const networkFeeRatio: bigint = BigIntMath.ceil(
        BigInt(fees.networkFee),
        1n - BigInt(fees.feeRatio)
      );
      const minimumTransfer = BigIntMath.max(minimumFees, networkFeeRatio);

      return minimumTransfer;
    } catch (error) {
      console.log(error);
      throw new FeeRetrievalFailureException("Failed to retrieve minimum fee");
    }
  }

  /**
   * gets list of chains that supports a token
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @param amount transfer amount
   * @param recommendedNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getAssetNetworkFee` function of toChain)
   * @returns the bridge and network fee
   */
  async getFeeByTransferAmount(
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    amount: bigint,
    recommendedNetworkFee: bigint = -1n,
    height: number = -1
  ): Promise<Fees> {
    const tokenIdOnErgo = this.checkTokenSupported(fromChain, tokenId, toChain);
    const explorerUrl = this.network.GetExplorerUrl("ergo");

    const minimumFee = new BridgeMinimumFee(
      explorerUrl,
      this.config.FeeConfigTokenId
    );

    try {
      var networkHeightForUse = 0;
      if (height === -1) {
        networkHeightForUse = await this.network.GetHeight(fromChain);
      } else {
        networkHeightForUse = height;
      }
      const feesInfo = await minimumFee.getFee(
        tokenIdOnErgo,
        fromChain,
        networkHeightForUse
      );
      const feeRatioDivisor: bigint = feesInfo
        ? BigInt(minimumFee.feeRatioDivisor)
        : 1n;
      const networkFee = feesInfo ? BigInt(feesInfo.networkFee) : 0n;
      const feeRatio: bigint = feesInfo ? BigInt(feesInfo?.feeRatio) : 0n;

      const bridgeFeeBase = feesInfo ? BigInt(feesInfo.bridgeFee) : 0n;
      const variableBridgeFee = BigIntMath.ceil(
        amount * feeRatio,
        feeRatioDivisor
      );

      const bridgeFee: bigint = BigIntMath.max(
        bridgeFeeBase,
        variableBridgeFee
      );

      const networkFeeToReturn = BigIntMath.max(
        recommendedNetworkFee,
        networkFee
      );
      const fees = new Fees(bridgeFee, networkFeeToReturn);
      return fees;
    } catch (error) {
      throw new FeeRetrievalFailureException();
    }
  }

  // <utils>
  checkTokenSupported(
    fromChain: string,
    tokenId: string,
    toChain: string
  ): string {
    const tokens = this.tokenMap.search(fromChain, { tokenId: tokenId });
    if (tokens.length <= 0) {
      throw new TokenNotFoundException();
    }

    const token = tokens[0];

    // Check if the chain exists
    try {
      this.tokenMap.getID(token, toChain);
    } catch (error) {
      throw new ChainNotSupportedException();
    }

    return this.tokenMap.getID(token, "ergo");
  }
  // </utils>
}
