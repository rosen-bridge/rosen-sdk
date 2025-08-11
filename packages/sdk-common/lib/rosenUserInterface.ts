import {
  NATIVE_TOKEN,
  RosenChainToken,
  RosenTokens,
  TokenMap,
} from '@rosen-bridge/tokens';
import {
  ChainMinimumFee,
  ErgoNetworkType,
  FEE_RATIO_DIVISOR,
  MinimumFeeBox,
} from '@rosen-bridge/minimum-fee';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import { NETWORKS } from './constants';
import {
  ChainNotSupportedException,
  FeeRetrievalFailureException,
  TokenNotFoundException,
} from './errors';
import { RosenFees } from './types';

class RosenUserInterface {
  private static instance: RosenUserInterface;
  logger: AbstractLogger;

  /**
   * Constructs a RosenUserInterface instance.
   * @param tokensMap TokenMap instance containing token configurations
   * @param minimumFeeNFT NFT id used for minimum fee calculation
   * @param ergoNetworkType Network type for Ergo chain
   * @param networkUrl URL of the network to connect
   * @param logger Optional logger instance
   */
  private constructor(
    protected tokensMap: TokenMap,
    protected minimumFeeNFT: string,
    protected ergoNetworkType: ErgoNetworkType,
    protected networkUrl: string,
    logger?: AbstractLogger,
  ) {
    this.logger = logger ?? new DummyLogger();
  }

  /**
   * Initializes the RosenUserInterface singleton instance.
   * @param tokens Token configuration for all supported chains
   * @param minimumFeeNFT NFT id used for minimum fee calculation
   * @param ergoNetworkType Network type for Ergo chain
   * @param networkUrl URL of the network to connect
   * @param logger Optional logger instance
   */
  public static initialize = async (
    tokens: RosenTokens,
    minimumFeeNFT: string,
    ergoNetworkType: ErgoNetworkType,
    networkUrl: string,
    logger?: AbstractLogger,
  ) => {
    const tokensMap = new TokenMap(logger);
    await tokensMap.updateConfigByJson(tokens);
    this.instance = new RosenUserInterface(
      tokensMap,
      minimumFeeNFT,
      ergoNetworkType,
      networkUrl,
      logger,
    );
    this.instance.logger.info('RosenUserInterface instance initialized');
  };

  /**
   * Returns the singleton instance after initialization.
   * @returns RosenUserInterface instance
   */
  public static getInstance = (): RosenUserInterface => {
    if (!this.instance) {
      throw new Error('RosenUserInterface instance has not been initialized.');
    }
    return this.instance;
  };

  /**
   * @returns list of supported chains
   */
  public getSupportedChains = (): Array<string> => {
    return this.tokensMap.getAllChains();
  };

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
  public getChainSupportedTokens = (chain: string): Array<RosenChainToken> => {
    return this.tokensMap.search(chain, {}).map((obj) => obj[chain]);
  };

  /**
   * Gets list of chains that supports a token
   * @param chain
   * @param tokenId token id on the given chain
   * @returns the list of chains that support
   */
  public getAvailableChainsForToken = (
    chain: string,
    tokenId: string,
  ): Array<string> => {
    this.logger.debug(
      `Getting available chains for tokenId [${tokenId}] on chain [${chain}]`,
    );
    const results = this.tokensMap.search(chain, { tokenId: tokenId });
    if (results.length === 0) {
      throw new TokenNotFoundException(chain, tokenId);
    }
    return Object.keys(results[0]);
  };

  /**
   * Retrieves token details for a given token on a source chain and checks if it exists on the target chain.
   * @param fromChain Source chain name
   * @param tokenId Token id on the source chain
   * @param toChain Target chain name
   * @returns Mapping of chain names to RosenChainToken details
   */
  private getTokenDetails = (
    fromChain: string,
    tokenId: string,
    toChain: string,
  ): Record<string, RosenChainToken> => {
    this.logger.debug(
      `Looking up tokenId [${tokenId}] on chain [${fromChain}] for target chain [${toChain}]`,
    );
    const tokensInChain = this.tokensMap.search(fromChain, {
      tokenId: tokenId,
    });
    if (tokensInChain.length === 0) {
      throw new TokenNotFoundException(fromChain, tokenId);
    }
    const tokenSet = tokensInChain[0];
    try {
      this.tokensMap.getID(tokenSet, toChain);
    } catch {
      throw new ChainNotSupportedException(tokenId, toChain);
    }
    return tokenSet;
  };

  /**
   * gets details of a token on a chain
   * @param fromChain
   * @param tokenId token id on the given chain
   * @param toChain
   * @returns the token details
   */
  public getTokenDetailsOnTargetChain = (
    fromChain: string,
    tokenId: string,
    toChain: string,
  ): RosenChainToken => {
    this.logger.debug(
      `Getting token details for tokenId [${tokenId}] from [${fromChain}] to [${toChain}]`,
    );
    const chains = this.getTokenDetails(fromChain, tokenId, toChain);
    return chains[toChain];
  };

  /**
   * Retrieves the MinimumFeeBox instance for a token id.
   * @param tokenId Token id on Ergo chain
   * @returns MinimumFeeBox instance for the token
   */
  private getMinimumFeeBox = async (
    tokenId: string,
  ): Promise<MinimumFeeBox> => {
    this.logger.debug(`Fetching minimum fee box for tokenId [${tokenId}]`);
    const minimumFee = new MinimumFeeBox(
      tokenId,
      this.minimumFeeNFT,
      this.ergoNetworkType,
      this.networkUrl,
      this.logger,
    );

    const fetchedBox = await minimumFee.fetchBox();
    if (!fetchedBox) {
      throw new FeeRetrievalFailureException(tokenId);
    }

    return minimumFee;
  };

  /**
   * calculates the minimum allowed transfer for a token based
   * on bridging chains, minimum bridge fee and network fee on a specific height
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @returns the minimum allowed transfer
   */
  public getMinimumTransferAmountForToken = async (
    fromChain: keyof typeof NETWORKS,
    toChain: keyof typeof NETWORKS,
    tokenId: string,
    height: number,
  ): Promise<bigint> => {
    this.logger.debug(
      `Calculating minimum transfer amount for tokenId [${tokenId}] from [${fromChain}] to [${toChain}] at height [${height}]`,
    );
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const ergoTokenId = this.tokensMap.getID(tokenChains, NETWORKS.ergo);

    const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(ergoTokenId);
    const fees: ChainMinimumFee = minimumFee.getFee(fromChain, height, toChain);

    const minimumFees: bigint =
      BigInt(fees.bridgeFee) + BigInt(fees.networkFee);

    const feeRatioComplement = FEE_RATIO_DIVISOR - fees.feeRatio;
    const otherMinTransfer: bigint =
      (fees.networkFee * FEE_RATIO_DIVISOR) / feeRatioComplement +
      ((fees.networkFee * FEE_RATIO_DIVISOR) % feeRatioComplement ? 1n : 0n);

    const fee = minimumFees > otherMinTransfer ? minimumFees : otherMinTransfer;
    const result = this.tokensMap.unwrapAmount(tokenId, fee, fromChain).amount;
    this.logger.debug(
      `Minimum transfer amount for tokenId [${tokenId}] from [${fromChain}] to [${toChain}]: [${result}]`,
    );
    return result;
  };

  /**
   * calculates the bridge fee and network fee for a token transfer
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param tokenId token id on fromChain
   * @param toChain
   * @param actualAmount transfer amount
   * @param actualRecommendedBaseNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getBaseNetworkFee` function of toChain)
   * @returns the bridge and network fee
   */
  public getFeeByTransferAmount = async (
    fromChain: string,
    tokenId: string,
    toChain: string,
    height: number,
    actualAmount: bigint,
    actualRecommendedBaseNetworkFee: bigint = 0n,
  ): Promise<RosenFees> => {
    this.logger.debug(
      `Calculating fees for transfer: tokenId=[${tokenId}], fromChain=[${fromChain}], toChain=[${toChain}], height=[${height}], amount=[${actualAmount}], recommendedBaseNetworkFee=[${actualRecommendedBaseNetworkFee}]`,
    );
    const wrappedAmount = this.tokensMap.wrapAmount(
      tokenId,
      actualAmount,
      fromChain,
    ).amount;
    const wrappedRecommendedBaseNetworkFee = this.tokensMap.wrapAmount(
      tokenId,
      actualRecommendedBaseNetworkFee,
      fromChain,
    ).amount;
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const ergoTokenId = this.tokensMap.getID(tokenChains, NETWORKS.ergo);

    const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(ergoTokenId);
    const fees: ChainMinimumFee = minimumFee.getFee(fromChain, height, toChain);

    const ratio = wrappedAmount * fees.feeRatio;
    const variableBridgeFee: bigint =
      ratio / fees.feeRatioDivisor + (ratio % fees.feeRatioDivisor ? 1n : 0n);

    const bridgeFee =
      fees.bridgeFee > variableBridgeFee ? fees.bridgeFee : variableBridgeFee;

    const unwrappedRecommendedBaseNetworkFee = this.tokensMap.unwrapAmount(
      tokenId,
      wrappedRecommendedBaseNetworkFee,
      fromChain,
    ).amount;

    const unwrappedRecommendedNetworkFee = await this.convertFeeToAssetUnit(
      tokenId,
      toChain,
      fromChain,
      height,
      unwrappedRecommendedBaseNetworkFee,
    );
    const wrappedRecommendedNetworkFee = this.tokensMap.wrapAmount(
      tokenId,
      unwrappedRecommendedNetworkFee,
      fromChain,
    ).amount;
    const networkFeeToReturn =
      wrappedRecommendedNetworkFee > fees.networkFee
        ? wrappedRecommendedNetworkFee
        : fees.networkFee;

    const unwrappedBridgeFee = this.tokensMap.unwrapAmount(
      tokenId,
      bridgeFee,
      fromChain,
    ).amount;

    const unwrappedNetworkFee = this.tokensMap.unwrapAmount(
      tokenId,
      networkFeeToReturn,
      fromChain,
    ).amount;

    this.logger.debug(
      `Calculated fees for tokenId [${tokenId}] from [${fromChain}] to [${toChain}]: bridgeFee=[${unwrappedBridgeFee}], networkFee=[${unwrappedNetworkFee}]`,
    );
    return {
      bridgeFee: unwrappedBridgeFee,
      networkFee: unwrappedNetworkFee,
    };
  };

  /**
   * converts base network fee for a chain to the given asset unit
   * @param tokenId
   * @param toChain
   * @param fromChain
   * @param height blockchain height of fromChain
   * @param actualBaseNetworkFee base network fee in toChain native token unit
   * @returns the network fee in asset unit
   */
  public convertFeeToAssetUnit = async (
    tokenId: string,
    toChain: string,
    fromChain: string,
    height: number,
    actualBaseNetworkFee: bigint,
  ): Promise<bigint> => {
    this.logger.debug(
      `Converting base network fee to asset unit: tokenId=[${tokenId}], fromChain=[${fromChain}], toChain=[${toChain}], height=[${height}], actualBaseNetworkFee=[${actualBaseNetworkFee}]`,
    );
    const wrapedBaseNetworkFee = this.tokensMap.wrapAmount(
      tokenId,
      actualBaseNetworkFee,
      fromChain,
    ).amount;
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const tokenIdOnErgo = this.tokensMap.getID(tokenChains, NETWORKS.ergo);

    const nativeTokens = this.tokensMap.search(toChain, {
      type: NATIVE_TOKEN,
    });

    if (nativeTokens.length <= 0) {
      throw new Error(`No Native token is found for chain [${toChain}]`);
    }

    const nativeToken = nativeTokens[0];

    const nativeTokenIdOnErgo = this.tokensMap.getID(
      nativeToken,
      NETWORKS.ergo,
    );

    const minimumFeeForGivenAsset = await this.getMinimumFeeBox(tokenIdOnErgo);
    const minimumFeeForChainNativeToken =
      await this.getMinimumFeeBox(nativeTokenIdOnErgo);

    const assetTokenFeesInfo: ChainMinimumFee = minimumFeeForGivenAsset.getFee(
      fromChain,
      height,
      toChain,
    );
    const nativeTokenFeesInfo: ChainMinimumFee =
      minimumFeeForChainNativeToken.getFee(fromChain, height, toChain);

    const nativeRsnRatio = nativeTokenFeesInfo.rsnRatio;
    const nativeRsnDivisor = nativeTokenFeesInfo.rsnRatioDivisor;
    const assetRsnRatio = assetTokenFeesInfo.rsnRatio;
    const assetRsnDivisor = assetTokenFeesInfo.rsnRatioDivisor;
    const result = this.calculateFeeToAssetUnitNetworkFee(
      nativeRsnRatio,
      nativeRsnDivisor,
      assetRsnRatio,
      assetRsnDivisor,
      wrapedBaseNetworkFee,
    );
    this.logger.debug(
      `Converted actual base network fee [${actualBaseNetworkFee}] to asset unit with tokenId [${tokenId}]: result=[${result}]`,
    );
    return result;
  };

  /**
   * Calculates the network fee in asset units based on ratios and decimals.
   * @param nativeRsnRatio RSN ratio for the native token
   * @param nativeRsnDivisor RSN ratio divisor for the native token
   * @param assetRsnRatio RSN ratio for the asset token
   * @param assetRsnDivisor RSN ratio divisor for the asset token
   * @param baseNetworkFee Base network fee in native token units
   * @returns Network fee in asset token units
   */
  private calculateFeeToAssetUnitNetworkFee = (
    nativeRsnRatio: bigint,
    nativeRsnDivisor: bigint,
    assetRsnRatio: bigint,
    assetRsnDivisor: bigint,
    baseNetworkFee: bigint,
  ): bigint => {
    this.logger.debug(
      `Calculating fee to asset unit: nativeRsnRatio=[${nativeRsnRatio}], nativeRsnDivisor=[${nativeRsnDivisor}], assetRsnRatio=[${assetRsnRatio}], assetRsnDivisor=[${assetRsnDivisor}], baseNetworkFee=[${baseNetworkFee}]`,
    );
    const result =
      (baseNetworkFee * nativeRsnRatio * assetRsnDivisor) /
      (assetRsnRatio * nativeRsnDivisor);

    this.logger.debug(`Calculated fee to asset unit: result=[${result}]`);
    return result;
  };
}

export default RosenUserInterface;
