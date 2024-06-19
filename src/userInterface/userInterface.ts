import {
  TokenMap,
  RosenTokens,
  RosenChainToken,
  NATIVE_RESIDENCY,
} from "@rosen-bridge/tokens";
import {
  ChainMinimumFee,
  ErgoNetworkType,
  MinimumFeeBox,
} from "@rosen-bridge/minimum-fee";
import { Networks } from "../constants/constants";
import { RosenSDKConfig } from "../config/RosenSDKConfig";
import { Network } from "../config/Network";
import { BigIntMath } from "../utils/bigintmath";
import {
  ChainNotSupportedException,
  FeeConversionFailureException,
  FeeRetrievalFailureException,
  TokenNotFoundException,
} from "../errors";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";

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
  ) => RosenChainToken;

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

  convertFeeToAssetUnit: (
    tokenId: string,
    toChain: keyof typeof Networks,
    height: number,
    baseNetworkFee: bigint
  ) => Promise<bigint>;
}

export class RosenUserInterface implements IRosenUserInterface {
  tokenMap: TokenMap;
  minimumFeeNFT: string;
  ergoNetworkType: ErgoNetworkType;
  logger?: AbstractLogger;
  networkUrl: string;
  private network: Network;

  constructor(
    tokens: RosenTokens,
    minimumFeeNFT: string,
    ergoNetworkType: ErgoNetworkType = ErgoNetworkType.explorer,
    networkUrl: string,
    config: RosenSDKConfig,
    logger?: AbstractLogger
  ) {
    this.tokenMap = new TokenMap(tokens);
    this.minimumFeeNFT = minimumFeeNFT;
    this.networkUrl = networkUrl;
    this.network = new Network(config.NetworkConfig);
    this.ergoNetworkType = ergoNetworkType;
    this.logger = logger;
  }

  /**
   * @returns list of supported chains
   */
  public getSupportedChains(): Array<string> {
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
  public getChainSupportedTokens(chain: string): Array<RosenChainToken> {
    return this.tokenMap.search(chain, {}).map((obj) => obj[chain]);
  }

  /**
   * Gets list of chains that supports a token
   * @param chain
   * @param tokenId token id on the given chain
   * @returns the list of chains that support
   */
  public getAvailableChainsForToken(
    chain: string,
    tokenId: string
  ): Array<string> {
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
  public getTokenDetailsOnTargetChain(
    chain: string,
    tokenId: string,
    targetChain: string
  ): RosenChainToken {
    const tokensInChain = this.tokenMap.search(chain, { tokenId: tokenId });

    if (tokensInChain.length <= 0) {
      throw new TokenNotFoundException();
    }

    const chains = tokensInChain[0];

    try {
      this.tokenMap.getID(chains, targetChain);
    } catch (error) {
      throw new ChainNotSupportedException(
        "Token is not supported on destination chain"
      );
    }

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
  public async getMinimumTransferAmountForToken(
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    height: number = -1
  ): Promise<bigint> {
    try {
      const tokenIdOnErgo = this.checkTokenSupported(
        fromChain,
        tokenId,
        toChain
      );
      var networkHeightForUse = await this.getNetworkHeight(height, fromChain);
      const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(
        tokenIdOnErgo
      );

      const fees: ChainMinimumFee = await minimumFee.getFee(
        fromChain,
        networkHeightForUse,
        toChain
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
      throw new FeeRetrievalFailureException(
        "Failed to retrieve minimum fee: " + error
      );
    }
  }

  /**
   * gets list of chains that supports a token
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @param amount transfer amount
   * @param recommendedNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getBaseNetworkFee` function of toChain)
   * @returns the bridge and network fee
   */
  public async getFeeByTransferAmount(
    fromChain: keyof typeof Networks,
    tokenId: string,
    toChain: keyof typeof Networks,
    amount: bigint,
    recommendedNetworkFee: bigint = -1n,
    height: number = -1
  ): Promise<Fees> {
    try {
      const tokenIdOnErgo = this.checkTokenSupported(
        fromChain,
        tokenId,
        toChain
      );
      var networkHeightForUse = await this.getNetworkHeight(height, fromChain);
      const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(
        tokenIdOnErgo
      );

      const feesInfo: ChainMinimumFee = await minimumFee.getFee(
        fromChain,
        networkHeightForUse,
        toChain
      );

      const feeRatioDivisor: bigint = BigInt(feesInfo.feeRatioDivisor);
      const networkFee = BigInt(feesInfo.networkFee);
      const feeRatio: bigint = BigInt(feesInfo?.feeRatio);

      const bridgeFeeBase = BigInt(feesInfo.bridgeFee);
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
      throw new FeeRetrievalFailureException(
        "Failed to retrieve fee: " + error
      );
    }
  }

  /**
   * converts base network fee for a chain to the given asset unit
   * @param tokenId
   * @param toChain
   * @param height blockchain height of toChain
   * @param baseNetworkFee base network fee in toChain native token unit
   * @returns the network fee in asset unit
   */
  public async convertFeeToAssetUnit(
    tokenId: string,
    toChain: keyof typeof Networks,
    height: number,
    baseNetworkFee: bigint
  ): Promise<bigint> {
    try {
      // 1. Search the token in the token map
      const tokens = this.tokenMap.search(toChain, { tokenId: tokenId });

      // 1a. If an empty list is returned, throw an error
      if (tokens.length <= 0) {
        throw new TokenNotFoundException();
      }

      // 2. Get the first element of the list
      const token = tokens[0];
      // 2a. If the target chain is not on the list of its keys, throw an error
      if (!token[toChain]) {
        throw new ChainNotSupportedException();
      }

      // 3. Get the corresponding tokenId on the ergo network using this object
      // and the getID function of the token map
      const tokenIdOnErgo: string = this.tokenMap.getID(token, "ergo");

      // 4. Search the native token of the target chain in the token map
      const nativeTokens = this.tokenMap
        .search(toChain, {})
        .filter(
          (searchedNativeTokens) =>
            searchedNativeTokens[toChain]?.metaData.type === NATIVE_RESIDENCY
        );

      if (nativeTokens.length <= 0) {
        throw new Error("Native token not found");
      }

      // 5. Get the first element of the list
      const nativeToken = nativeTokens[0];

      // 6. Get the corresponding token ID on the Ergo network using this object and the
      // 'getID'
      const nativeTokenIdOnErgo: string = this.tokenMap.getID(
        nativeToken,
        "ergo"
      );

      // 7. Get the rsn ratio for the token and the nativetoken using the minimum fee
      // package
      const minimumFeeForAssetToken = await this.getMinimumFeeBox(
        tokenIdOnErgo
      );
      const minimumFeeForNativeChainToken = await this.getMinimumFeeBox(
        nativeTokenIdOnErgo
      );

      var networkHeightForUse = await this.getNetworkHeight(height, toChain);
      const assetTokenFeesInfo: ChainMinimumFee =
        await minimumFeeForAssetToken.getFee(
          toChain,
          networkHeightForUse,
          toChain
        );
      const nativeTokenFeesInfo: ChainMinimumFee =
        await minimumFeeForNativeChainToken.getFee(
          toChain,
          networkHeightForUse,
          toChain
        );

      const nativeRsnRatio: bigint = nativeTokenFeesInfo.rsnRatio;
      const nativeRsnDivisor: bigint = nativeTokenFeesInfo.rsnRatioDivisor;
      const nativeDecimals: number = nativeToken[toChain].decimals;
      const assetRsnRatio: bigint = assetTokenFeesInfo.rsnRatio;
      const assetRsnDivisor: bigint = assetTokenFeesInfo.rsnRatioDivisor;
      const assetDecimals: number = token[toChain].decimals;
      const networkFeeInAssetUnitToken: bigint =
        this.calculateFeeToAssetUnitNetworkFee(
          nativeRsnRatio,
          nativeRsnDivisor,
          nativeDecimals,
          assetRsnRatio,
          assetRsnDivisor,
          assetDecimals,
          baseNetworkFee
        );

      return networkFeeInAssetUnitToken;
    } catch (error) {
      throw new FeeConversionFailureException(
        "Failed to convert fee to native network fee: " + error
      );
    }
  }

  // <utils>
  public calculateFeeToAssetUnitNetworkFee(
    nativeRsnRatio: bigint,
    nativeRsnDivisor: bigint,
    nativeDecimals: number,
    assetRsnRatio: bigint,
    assetRsnDivisor: bigint,
    assetDecimals: number,
    baseNetworkFee: bigint
  ): bigint {
    const nativePoweredDecimal: bigint = BigInt(Math.pow(10, nativeDecimals));
    const assetPoweredDecimal: bigint = BigInt(Math.pow(10, assetDecimals));
    const networkFeeInAssetUnitToken: bigint =
      (baseNetworkFee *
        assetPoweredDecimal *
        nativeRsnRatio *
        assetRsnDivisor) /
      (assetRsnRatio * nativePoweredDecimal * nativeRsnDivisor);

    return networkFeeInAssetUnitToken;
  }

  private checkTokenSupported(
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

  private async getNetworkHeight(
    height: number,
    chain: keyof typeof Networks
  ): Promise<number> {
    if (height === -1) {
      return await this.network.getHeight(chain);
    } else {
      return height;
    }
  }

  private async getMinimumFeeBox(tokenId: string): Promise<MinimumFeeBox> {
    const explorerUrl =
      this.networkUrl !== ""
        ? this.networkUrl
        : this.network.getExplorerUrl("ergo");

    const minimumFee = new MinimumFeeBox(
      tokenId,
      this.minimumFeeNFT,
      this.ergoNetworkType,
      explorerUrl,
      this.logger
    );

    const fetchedBox = await minimumFee.fetchBox();
    if (!fetchedBox) {
      throw new FeeRetrievalFailureException(
        `Failed to fetch Minimum fee box for token [${tokenId}]`
      );
    }

    return minimumFee;
  }
  // </utils>
}
