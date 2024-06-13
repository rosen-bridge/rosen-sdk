import { it, assert, describe, expect } from "vitest";
import { RosenUserInterface } from "../../src/userInterface/userInterface";
import tokens from "../assets/test-rosen-loen-tokens.json";
import { NATIVE_TOKEN, RosenChainToken } from "@rosen-bridge/tokens";
import { ErgoNetworkType } from "@rosen-bridge/minimum-fee";
import { RosenChains } from "../../src";
import { LoenRosenSDKConfig, testRSNRatioNFT } from "../testConfig";
import { ERGO_EXPLORER_URL } from "../../src/constants/constants";

const EIP4 = "EIP-004";
const CIP26 = "CIP26";
const TEST_INPUTS = {
  ergo: {
    transferAmount: 100000000000000n,
    height: 1278805,
  },
  cardano: {
    transferAmount: 100000000000000n,
    height: 10378915,
  },
};

const TEST_RESULT_CONSTANT = {
  ergo: {
    minimumFee: 500000000n,
    bridgeFee: 1000000000000n,
    networkFee: 250000000n,
  },
  cardano: {
    minimumFee: 4800000n,
    bridgeFee: 1000000000000n,
    networkFee: 800000n,
  },
};

describe("rosen user interface", () => {
  const rosenUI: RosenUserInterface = new RosenUserInterface(
    // @ts-ignore
    tokens,
    testRSNRatioNFT,
    ErgoNetworkType.explorer,
    ERGO_EXPLORER_URL,
    LoenRosenSDKConfig
  );

  it("getSupportedChains", () => {
    const supportedChains: Array<string> = rosenUI.getSupportedChains();
    assert.equal(supportedChains.length, 3);

    const ergoChain = supportedChains.includes("ergo");
    const cardanoChain = supportedChains.includes("cardano");
    const bitcoinChain = supportedChains.includes("bitcoin");
    const xyzChain = supportedChains.includes("xyz");

    assert.isTrue(ergoChain);
    assert.isTrue(cardanoChain);
    assert.isTrue(bitcoinChain);
    assert.isFalse(xyzChain);
  });

  it("getChainSupportedTokens", () => {
    const checkChainSupportedTokensMetadataType = (
      chain: string,
      nativeTokenName: string,
      metadataType: string
    ) => {
      const tokens: Array<RosenChainToken> =
        rosenUI.getChainSupportedTokens(chain);

      tokens.forEach((token) => {
        if (token.name !== nativeTokenName)
          assert.equal(token.metaData.type, metadataType);
        else assert.equal(token.metaData.type, "native");
      });
    };

    checkChainSupportedTokensMetadataType("ergo", "ERG", EIP4);
    checkChainSupportedTokensMetadataType("cardano", "ADA", CIP26);
  });

  it("getAvailableChainsForToken", () => {
    const checkAvailableChainsForToken = (chain: string, tokenId: string) => {
      const chainsForToken = rosenUI.getAvailableChainsForToken(chain, tokenId);
      const isAvailableInErgo = chainsForToken.includes("ergo");
      const isAvailableInCardano = chainsForToken.includes("cardano");
      const isAvailableInXYZ = chainsForToken.includes("xyz");

      assert.isTrue(isAvailableInCardano);
      assert.isTrue(isAvailableInErgo);
      assert.isFalse(isAvailableInXYZ);
    };

    checkAvailableChainsForToken("cardano", "ada");
    checkAvailableChainsForToken("ergo", "erg");
  });

  it("checkAvailableChainsForToken against btc", () => {
    const btcChainsForToken = rosenUI.getAvailableChainsForToken(
      "bitcoin",
      "btc"
    );
    const isBTCAvailableInErgo = btcChainsForToken.includes("ergo");
    const isBTCAvailableInCardano = btcChainsForToken.includes("cardano");
    const isBTCAvailableInBitcoin = btcChainsForToken.includes("bitcoin");
    const isBTCAvailableInXYZ = btcChainsForToken.includes("xyz");

    assert.isTrue(isBTCAvailableInCardano);
    assert.isTrue(isBTCAvailableInErgo);
    assert.isTrue(isBTCAvailableInBitcoin);
    assert.isFalse(isBTCAvailableInXYZ);

    const rsnChainsForToken = rosenUI.getAvailableChainsForToken("ergo", "erg");
    const isRsnAvailableInErgo = rsnChainsForToken.includes("ergo");
    const isRsnAvailableInCardano = rsnChainsForToken.includes("cardano");
    const isRsnAvailableInBitcoin = rsnChainsForToken.includes("bitcoin");
    const isRsnAvailableInXYZ = rsnChainsForToken.includes("xyz");

    assert.isTrue(isRsnAvailableInCardano);
    assert.isTrue(isRsnAvailableInErgo);
    assert.isFalse(isRsnAvailableInBitcoin);
    assert.isFalse(isRsnAvailableInXYZ);
  });

  it("getTokenDetailsOnTargetChain", () => {
    const checkTokenDetailsOnTargetChain = (
      chain: string,
      tokenId: string,
      targetChain: string,
      expectedTokenName: string,
      expectedTokenMetadataType: string
    ) => {
      const tokens = rosenUI.getTokenDetailsOnTargetChain(
        chain,
        tokenId,
        targetChain
      );
      assert.equal(tokens.name, expectedTokenName);
      assert.equal(tokens.metaData.type, expectedTokenMetadataType);
    };

    const rsErgTokenId =
      "fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.77724552472d6c6f656e";
    const rsADATokenId =
      "0bf47c19e49944a38948c635c0aef93d89737aa68df5ad881b07c8f9a63e398d";
    checkTokenDetailsOnTargetChain(
      "ergo",
      "erg",
      "cardano",
      "wrERG-loen",
      CIP26
    );
    checkTokenDetailsOnTargetChain(
      "cardano",
      "ada",
      "ergo",
      "wrADA-loen",
      EIP4
    );
    checkTokenDetailsOnTargetChain(
      "cardano",
      rsErgTokenId,
      "ergo",
      "ERG",
      NATIVE_TOKEN
    );
    checkTokenDetailsOnTargetChain(
      "ergo",
      rsADATokenId,
      "cardano",
      "ADA",
      NATIVE_TOKEN
    );
  });

  it("getTokenDetailsOnTargetChain chain not supported", () => {
    const checkTokenDetailsOnTargetChain = (
      chain: string,
      tokenId: string,
      targetChain: string
    ) => {
      expect(() =>
        rosenUI.getTokenDetailsOnTargetChain(chain, tokenId, targetChain)
      ).toThrowError("Token is not supported on destination chain");
    };

    checkTokenDetailsOnTargetChain("ergo", "erg", "bitcoin");
  });

  /**
   * Calculates the minimum fee for transferring at a certain
   * block height
   */
  it("getMinimumTransferAmountForToken", async () => {
    const ergoMinimumFee = await rosenUI.getMinimumTransferAmountForToken(
      "ergo",
      "erg",
      "cardano",
      TEST_INPUTS.ergo.height
    );
    const cardanoMinimumFee = await rosenUI.getMinimumTransferAmountForToken(
      "cardano",
      "ada",
      "ergo",
      TEST_INPUTS.cardano.height
    );

    assert.equal(ergoMinimumFee, TEST_RESULT_CONSTANT.ergo.minimumFee);
    assert.equal(cardanoMinimumFee, TEST_RESULT_CONSTANT.cardano.minimumFee);
  });

  it("getFeeByTransferAmount", async () => {
    const ergoMinimumFee = await rosenUI.getFeeByTransferAmount(
      "ergo",
      "erg",
      "cardano",
      TEST_INPUTS.ergo.transferAmount,
      -1n,
      TEST_INPUTS.ergo.height
    );

    const cardanoMinimumFee = await rosenUI.getFeeByTransferAmount(
      "cardano",
      "ada",
      "ergo",
      TEST_INPUTS.cardano.transferAmount,
      -1n,
      TEST_INPUTS.cardano.height
    );

    assert.equal(ergoMinimumFee.bridgeFee, TEST_RESULT_CONSTANT.ergo.bridgeFee);
    assert.equal(
      ergoMinimumFee.networkFee,
      TEST_RESULT_CONSTANT.ergo.networkFee
    );
    assert.equal(
      cardanoMinimumFee.bridgeFee,
      TEST_RESULT_CONSTANT.cardano.bridgeFee
    );
    assert.equal(
      cardanoMinimumFee.networkFee,
      TEST_RESULT_CONSTANT.cardano.networkFee
    );
  });

  it("getFeeByTransferAmount with Variable network fee", async () => {
    const variableNetworkFee = 10000000000n;
    const ergoMinimumFee = await rosenUI.getFeeByTransferAmount(
      "ergo",
      "erg",
      "cardano",
      TEST_INPUTS.ergo.transferAmount,
      variableNetworkFee,
      TEST_INPUTS.ergo.height
    );

    const cardanoMinimumFee = await rosenUI.getFeeByTransferAmount(
      "cardano",
      "ada",
      "ergo",
      TEST_INPUTS.cardano.transferAmount,
      variableNetworkFee,
      TEST_INPUTS.cardano.height
    );

    assert.equal(ergoMinimumFee.bridgeFee, TEST_RESULT_CONSTANT.ergo.bridgeFee);
    assert.equal(ergoMinimumFee.networkFee, variableNetworkFee);
    assert.equal(
      cardanoMinimumFee.bridgeFee,
      TEST_RESULT_CONSTANT.cardano.bridgeFee
    );
    assert.equal(cardanoMinimumFee.networkFee, variableNetworkFee);
  });

  /**
   * Sample tests value
   * native
   * nativeRsnRatio: 500000
   * nativeRsnDivisor: 100000000
   * nativeDecimals: 6
   * nativePoweredDecimal: 1000000
   * asset
   * assetRsnRatio: 200000
   * assetRsnDivisor: 10000000000
   * assetDecimals: 9
   * assetPoweredDecimal: 1000000000
   * baseNetworkFee: 3400000
   * total
   * networkFeeInNativeToken: 850000000000
   */
  it("convertFeeToAssetUnit", async () => {
    const wrappedAdaTokenId =
      "fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.77724552472d6c6f656e";
    const convertFeeToAssetUnit = await rosenUI.convertFeeToAssetUnit(
      wrappedAdaTokenId,
      "cardano",
      10408366,
      RosenChains.getBaseNetworkFee("cardano")
    );

    assert.equal(convertFeeToAssetUnit, 850000000000n);
  });
});
