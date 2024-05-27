// import { RosenSDK } from '../RosenSDK'; // Adjust the path based on your structure
import { it, assert, describe } from "vitest";
import { RosenUserInterface } from "../src/userInterface/userInterface";
import tokens from "./test-rosen-tokens.json";
import minimumFee from "../minimumFee.json";
import { RosenChainToken } from "@rosen-bridge/tokens";
import { TokenType } from "../src/types/tokensType";

describe("rosen user interface", () => {
  const rosenUI: RosenUserInterface = new RosenUserInterface(
    tokens,
    minimumFee.tokens.RSNRatioNFT,
    minimumFee.addresses.MinimumFeeAddress
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
      metadataType: TokenType
    ) => {
      const tokens: Array<RosenChainToken> =
        rosenUI.getChainSupportedTokens(chain);

      tokens.forEach((token) => {
        if (token.name !== nativeTokenName)
          assert.equal(token.metaData.type, metadataType);
        else assert.equal(token.metaData.type, "native");
      });
    };

    checkChainSupportedTokensMetadataType("ergo", "ERG", TokenType.EIPOO4);
    checkChainSupportedTokensMetadataType("cardano", "ADA", TokenType.CIP26);
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
      "04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14.7273455247";
    const rsADATokenId =
      "e023c5f382b6e96fbd878f6811aac73345489032157ad5affb84aefd4956c297";
    checkTokenDetailsOnTargetChain(
      "ergo",
      "erg",
      "cardano",
      "rsERG",
      TokenType.CIP26
    );
    checkTokenDetailsOnTargetChain(
      "cardano",
      "ada",
      "ergo",
      "rsADA",
      TokenType.EIPOO4
    );
    checkTokenDetailsOnTargetChain(
      "cardano",
      rsErgTokenId,
      "ergo",
      "ERG",
      TokenType.NATIVE
    );
    checkTokenDetailsOnTargetChain(
      "ergo",
      rsADATokenId,
      "cardano",
      "ADA",
      TokenType.NATIVE
    );
  });
});
