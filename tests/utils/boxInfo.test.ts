import { AssetBalance } from "@rosen-bridge/cardano-utxo-selection";
import { it, assert, describe, expect } from "vitest";
import { BoxInfoExtractor } from "../../src/utils/boxInfo";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";

describe("BoxInfoExtractor.getAssetBalance", () => {
  it("Invalid Input", () => {
    const invalidInput = {
      hello: "world",
      value: 100n,
    };

    // @ts-ignore
    expect(() => BoxInfoExtractor.getAssetBalance(invalidInput)).toThrowError();
  });

  it("ErgoBoxProxy", () => {
    const asset1 = {
      tokenId: "tokenId1",
      amount: "2",
    };
    const asset2 = {
      tokenId: "tokenId2",
      amount: "1",
    };
    const ergoBox: ErgoBoxProxy = {
      boxId: "testId",
      transactionId: "testTxId",
      index: 0,
      ergoTree: "123",
      creationHeight: 123,
      value: "100",
      assets: [asset1, asset2],
      additionalRegisters: {},
    };

    const assetBalance: AssetBalance =
      BoxInfoExtractor.getAssetBalance(ergoBox);

    const expectedAssetBalance: AssetBalance = {
      nativeToken: BigInt(ergoBox.value),
      tokens: [
        {
          id: asset1.tokenId,
          value: BigInt(asset1.amount),
        },
        {
          id: asset2.tokenId,
          value: BigInt(asset2.amount),
        },
      ],
    };
    assert.deepEqual(assetBalance, expectedAssetBalance);
  });

  it("CardanoUtxo", () => {
    const boxValue = 100n;
    const asset1 = {
      policyId: "testPolicyId1",
      assetName: "assetName1",
      quantity: 2n,
    };
    const asset2 = {
      policyId: "testPolicyId2",
      assetName: "assetName2",
      quantity: 1n,
    };
    const box = {
      txId: "testId",
      index: 0,
      address: "testAddress",
      value: boxValue,
      assets: [asset1, asset2],
    };

    const assetBalance: AssetBalance = BoxInfoExtractor.getAssetBalance(box);

    const expectedAssetBalance: AssetBalance = {
      nativeToken: boxValue,
      tokens: [
        {
          id: `${asset1.policyId}.${asset1.assetName}`,
          value: asset1.quantity,
        },
        {
          id: `${asset2.policyId}.${asset2.assetName}`,
          value: asset2.quantity,
        },
      ],
    };
    assert.deepEqual(assetBalance, expectedAssetBalance);
  });
});

describe("BoxInfoExtractor.getBoxInfo", () => {
  // Define a mock ErgoBoxProxy object for testing.
  const mockErgoBoxProxy = {
    boxId: "box123",
    transactionId: "tx456",
    index: 0,
    ergoTree: "someErgoTree",
    creationHeight: 100,
    value: "500",
    assets: [
      { tokenId: "token1", amount: "100" },
      { tokenId: "token2", amount: "200" },
    ],
    additionalRegisters: {},
  };

  it("should correctly extract box id and assets", () => {
    const result = BoxInfoExtractor.getBoxInfo(mockErgoBoxProxy);
    expect(result.id).toBe("box123");
    expect(result.assets.nativeToken).toBe(BigInt(500));
    expect(result.assets.tokens).toEqual([
      { id: "token1", value: BigInt(100) },
      { id: "token2", value: BigInt(200) },
    ]);
  });

  it("should throw error if the box is not a valid ErgoBoxProxy", () => {
    const invalidBox = { someOtherKey: 123 }; // Incorrect structure
    // @ts-ignore
    const testCall = () => BoxInfoExtractor.getBoxInfo(invalidBox);
    expect(testCall).toThrow("Box is not an ErgoBoxProxy type");
  });
});
