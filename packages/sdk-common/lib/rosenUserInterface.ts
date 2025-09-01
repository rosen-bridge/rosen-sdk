import { NATIVE_TOKEN, RosenChainToken, TokenMap } from '@rosen-bridge/tokens';
import {
  ChainMinimumFee,
  ErgoNetworkType,
  FEE_RATIO_DIVISOR,
  MinimumFeeBox,
} from '@rosen-bridge/minimum-fee';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/abstract-logger';
import {
  ChainNotSupportedException,
  FeeRetrievalFailureException,
  TokenNotFoundException,
} from './errors';
import { RosenFees } from './types';
import { bigIntCeil } from './utils';
import { NETWORKS } from '@rosen-bridge/sdk-constant';

class RosenUserInterface {
  logger: AbstractLogger;

  /**
   * Constructs a RosenUserInterface instance.
   * @param tokenMap TokenMap instance containing token configurations
   * @param minimumFeeNFT NFT id used for minimum fee calculation
   * @param ergoNetworkType Network type for Ergo chain
   * @param networkUrl URL of the network to connect
   * @param logger Optional logger instance
   */
  constructor(
    protected tokenMap: TokenMap,
    protected minimumFeeNFT: string,
    protected ergoNetworkType: ErgoNetworkType,
    protected networkUrl: string,
    logger?: AbstractLogger,
  ) {
    this.logger = logger ?? new DummyLogger();
  }

  /**
   * @returns list of supported chains
   */
  public getSupportedChains = (): Array<string> => {
    return Object.values(NETWORKS);
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
  public getChainSupportedTokens = (
    chain: NETWORKS,
  ): Array<RosenChainToken> => {
    return this.tokenMap.search(chain, {}).map((obj) => obj[chain]);
  };

  /**
   * Gets list of chains that supports a token
   * @param chain
   * @param tokenId token id on the given chain
   * @returns the list of chains that support
   */
  public getAvailableChainsForToken = (
    chain: NETWORKS,
    tokenId: string,
  ): Array<string> => {
    this.logger.debug(
      `Getting available chains for tokenId [${tokenId}] on chain [${chain}]`,
    );
    const results = this.tokenMap.search(chain, { tokenId: tokenId });
    if (results.length === 0) {
      throw new TokenNotFoundException(chain, tokenId);
    }
    return Object.keys(results[0]);
  };

  /**
   * Retrieves token details for a given token on a source chain and checks if it exists on the target chain.
   * @param fromChain Source chain name
   * @param tokenId Token id on the fromChain
   * @param toChain Target chain name
   * @returns Mapping of chain names to RosenChainToken details
   */
  private getTokenDetails = (
    fromChain: NETWORKS,
    tokenId: string,
    toChain: NETWORKS,
  ): Record<string, RosenChainToken> => {
    this.logger.debug(
      `Looking up tokenId [${tokenId}] on chain [${fromChain}] for target chain [${toChain}]`,
    );
    const tokensInChain = this.tokenMap.search(fromChain, {
      tokenId: tokenId,
    });
    if (tokensInChain.length === 0) {
      throw new TokenNotFoundException(fromChain, tokenId);
    }
    const tokenSet = tokensInChain[0];
    try {
      this.tokenMap.getID(tokenSet, toChain);
    } catch {
      throw new ChainNotSupportedException(tokenId, toChain);
    }
    return tokenSet;
  };

  /**
   * gets details of a token on a chain
   * @param fromChain
   * @param tokenId Token id on the fromChain
   * @param toChain
   * @returns the token details
   */
  public getTokenDetailsOnTargetChain = (
    fromChain: NETWORKS,
    tokenId: string,
    toChain: NETWORKS,
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
   * @param tokenId token id on fromChain
   * @param height blockchain height of fromChain
   * @param toChain
   * @returns the minimum allowed transfer
   */
  public getMinimumTransferAmountForToken = async (
    fromChain: NETWORKS,
    tokenId: string,
    height: number,
    toChain: NETWORKS,
  ): Promise<bigint> => {
    this.logger.debug(
      `Calculating minimum transfer amount for tokenId [${tokenId}] from [${fromChain}] to [${toChain}] at height [${height}]`,
    );
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const ergoTokenId = this.tokenMap.getID(tokenChains, NETWORKS.ERGO);
    const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(ergoTokenId);
    const fees: ChainMinimumFee = minimumFee.getFee(fromChain, height, toChain);

    const minimumFees: bigint =
      BigInt(fees.bridgeFee) + BigInt(fees.networkFee) + 1n;
    const feeRatioComplement = FEE_RATIO_DIVISOR - fees.feeRatio;
    const otherMinTransfer: bigint = bigIntCeil(
      (fees.networkFee + 1n) * FEE_RATIO_DIVISOR,
      feeRatioComplement,
    );
    const fee = minimumFees > otherMinTransfer ? minimumFees : otherMinTransfer;
    const result = this.tokenMap.unwrapAmount(tokenId, fee, fromChain).amount;
    this.logger.debug(
      `Minimum transfer amount for tokenId [${tokenId}] from [${fromChain}] to [${toChain}]: [${result}]`,
    );
    return result;
  };

  /**
   * calculates the bridge fee and network fee for a token transfer
   * @param fromChain
   * @param tokenId token id on fromChain
   * @param height blockchain height of fromChain
   * @param toChain
   * @param actualAmount transfer amount
   * @param actualRecommendedBaseNetworkFee the current network fee on toChain (it is highly recommended to fetch this value from `getBaseNetworkFee` function of toChain)
   * @returns the bridge and network fee
   */
  public getFeeByTransferAmount = async (
    fromChain: NETWORKS,
    tokenId: string,
    height: number,
    toChain: NETWORKS,
    actualAmount: bigint,
    actualRecommendedBaseNetworkFee: bigint = 0n,
  ): Promise<RosenFees> => {
    this.logger.debug(
      `Calculating fees for transfer: tokenId=[${tokenId}], fromChain=[${fromChain}], toChain=[${toChain}], height=[${height}], amount=[${actualAmount}], recommendedBaseNetworkFee=[${actualRecommendedBaseNetworkFee}]`,
    );
    const wrappedAmount = this.tokenMap.wrapAmount(
      tokenId,
      actualAmount,
      fromChain,
    ).amount;
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const ergoTokenId = this.tokenMap.getID(tokenChains, NETWORKS.ERGO);

    const minimumFee: MinimumFeeBox = await this.getMinimumFeeBox(ergoTokenId);
    const fees: ChainMinimumFee = minimumFee.getFee(fromChain, height, toChain);

    const ratio = wrappedAmount * fees.feeRatio;
    const variableBridgeFee: bigint = bigIntCeil(ratio, fees.feeRatioDivisor);

    const bridgeFee =
      fees.bridgeFee > variableBridgeFee ? fees.bridgeFee : variableBridgeFee;

    let wrappedRecommendedNetworkFee: bigint = 0n;

    if (actualRecommendedBaseNetworkFee > 0n) {
      const wrappedRecommendedBaseNetworkFee = this.tokenMap.wrapAmount(
        tokenId,
        actualRecommendedBaseNetworkFee,
        fromChain,
      ).amount;

      const unwrappedRecommendedBaseNetworkFee = this.tokenMap.unwrapAmount(
        tokenId,
        wrappedRecommendedBaseNetworkFee,
        fromChain,
      ).amount;

      const unwrappedRecommendedNetworkFee = await this.convertFeeToAssetUnit(
        fromChain,
        tokenId,
        height,
        toChain,
        unwrappedRecommendedBaseNetworkFee,
      );

      wrappedRecommendedNetworkFee = this.tokenMap.wrapAmount(
        tokenId,
        unwrappedRecommendedNetworkFee,
        fromChain,
      ).amount;
    }

    const networkFeeToReturn =
      wrappedRecommendedNetworkFee > fees.networkFee
        ? wrappedRecommendedNetworkFee
        : fees.networkFee;

    const unwrappedBridgeFee = this.tokenMap.unwrapAmount(
      tokenId,
      bridgeFee,
      fromChain,
    ).amount;

    const unwrappedNetworkFee = this.tokenMap.unwrapAmount(
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
   * converts fee for a chain to the given asset unit
   * @param fromChain
   * @param tokenId Token id on the fromChain
   * @param height blockchain height of fromChain
   * @param toChain
   * @param fee fee in toChain native token unit
   * @returns the fee in asset unit
   */
  public convertFeeToAssetUnit = async (
    fromChain: NETWORKS,
    tokenId: string,
    height: number,
    toChain: NETWORKS,
    fee: bigint,
  ): Promise<bigint> => {
    this.logger.debug(
      `Converting fee to asset unit: tokenId=[${tokenId}], fromChain=[${fromChain}], toChain=[${toChain}], height=[${height}], fee=[${fee}]`,
    );
    const wrappedFee = this.tokenMap.wrapAmount(
      tokenId,
      fee,
      toChain, // The fee is in the toChain native token unit so the value should be wrapped from toChain
    ).amount;
    const tokenChains = this.getTokenDetails(fromChain, tokenId, toChain);
    const tokenIdOnErgo = this.tokenMap.getID(tokenChains, NETWORKS.ERGO);

    const nativeTokens = this.tokenMap.search(toChain, {
      type: NATIVE_TOKEN,
    });

    if (nativeTokens.length <= 0) {
      throw new Error(`No Native token is found for chain [${toChain}]`);
    }

    const nativeToken = nativeTokens[0];

    const nativeTokenIdOnErgo = this.tokenMap.getID(nativeToken, NETWORKS.ERGO);

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
    const wrappedFeeInAssetUnit = this.calculateFeeToAssetUnitNetworkFee(
      nativeRsnRatio,
      nativeRsnDivisor,
      assetRsnRatio,
      assetRsnDivisor,
      wrappedFee,
    );
    const unwrappedFeeInAssetUnit = this.tokenMap.unwrapAmount(
      tokenId,
      wrappedFeeInAssetUnit,
      fromChain,
    );
    return unwrappedFeeInAssetUnit.amount;
  };

  /**
   * Calculates the network fee in asset units based on ratios.
   * @param nativeRsnRatio RSN ratio for the native token
   * @param nativeRsnDivisor RSN ratio divisor for the native token
   * @param assetRsnRatio RSN ratio for the asset token
   * @param assetRsnDivisor RSN ratio divisor for the asset token
   * @param wrappedFee wrapped fee in native token units
   * @returns Network fee in asset token units
   */
  private calculateFeeToAssetUnitNetworkFee = (
    nativeRsnRatio: bigint,
    nativeRsnDivisor: bigint,
    assetRsnRatio: bigint,
    assetRsnDivisor: bigint,
    wrappedFee: bigint,
  ): bigint => {
    this.logger.debug(
      `Calculating fee to asset unit: nativeRsnRatio=[${nativeRsnRatio}], nativeRsnDivisor=[${nativeRsnDivisor}], assetRsnRatio=[${assetRsnRatio}], assetRsnDivisor=[${assetRsnDivisor}], wrappedFee=[${wrappedFee}]`,
    );

    const result = bigIntCeil(
      wrappedFee * nativeRsnRatio * assetRsnDivisor,
      assetRsnRatio * nativeRsnDivisor,
    );

    this.logger.debug(`Calculated fee to asset unit: result=[${result}]`);
    return result;
  };
}

export default RosenUserInterface;
