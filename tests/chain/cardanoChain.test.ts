import { describe, it, expect } from "vitest";
import * as wasm from "@emurgo/cardano-serialization-lib-nodejs";
import tokens from "../assets/test-rosen-loen-tokens.json";
import cardanoContracts from "../assets/test-cardano-loen-contracts.json";
import { CardanoRosenExtractor } from "@rosen-bridge/rosen-extractor";
import { CardanoRosenSDK, RosenUserInterface } from "../../src";
import { LoenRosenSDKConfig, testRSNRatioNFT } from "../testConfig";
import { ErgoNetworkType } from "@rosen-bridge/minimum-fee";
import { ERGO_EXPLORER_URL } from "../../src/constants/constants";
import { blockFrostRosenData } from "./mockData";
import {
  CardanoAsset,
  CardanoUtxo,
} from "@rosen-bridge/cardano-utxo-selection";
import JsonBigInt from "@rosen-bridge/json-bigint";
import { InsufficientAssetsException } from "../../src/errors";

const rsBtc = {
  tokenId:
    "3122541486c983d637e7ed9330c94e490e1fe4a1758725fab7f6d9e0.72734254432d6c6f656e",
  policyId: "3122541486c983d637e7ed9330c94e490e1fe4a1758725fab7f6d9e0",
  assetName: "72734254432d6c6f656e",
};

const generateCardanoUtxo = (
  txId: string,
  index: number,
  address: string,
  value: bigint,
  assets: Array<CardanoAsset>
): CardanoUtxo => {
  return {
    txId,
    index,
    address,
    value,
    assets,
  };
};

const convertTxHexStringToCardanoTx = (
  hexTx: string,
  cardanoInput: CardanoUtxo
) => {
  const validTx = wasm.Transaction.from_hex(hexTx);
  const jsonTx = JSON.parse(validTx.to_json());
  const jsonObject = JSON.parse(jsonTx.auxiliary_data.metadata[0]);

  // Extract the map array
  const mapArray = jsonObject.map;

  // Create a new JavaScript Map
  const metadata = {
    "0": {},
  };

  // Iterate over the map array and populate the JavaScript Map
  mapArray.forEach((item: any) => {
    // @ts-ignore
    metadata["0"][item.k.string] =
      // @ts-ignore
      item.v.string || item.v.list.map((i) => i.string);
  });

  const mutatedOutputs = jsonTx.body.outputs.map((output: any) => {
    const derivedAssets =
      output.amount.multiasset !== undefined &&
      output.amount.multiAsset !== null
        ? output.amount.multiasset
        : [];
    const cleanupAssets = derivedAssets === null ? [] : derivedAssets;

    var assets: Array<any> = [];
    if (cleanupAssets !== null) {
      const policyIds = Object.keys(cleanupAssets);

      policyIds.forEach((policyId) => {
        const asset_object = cleanupAssets[policyId];
        const asset_name = Object.keys(asset_object)[0];
        assets.push({
          policy_id: policyId,
          asset_name,
          quantity: cleanupAssets[policyId][asset_name],
        });
      });
    }

    return {
      address: output.address,
      value: BigInt(output.amount.coin),
      assets,
    };
  });

  const mutatedInputs = jsonTx.body.inputs.map((input: any) => {
    const assets =
      cardanoInput.assets !== undefined && cardanoInput !== null
        ? cardanoInput.assets
        : [];

    return {
      txId: input.transaction_id,
      index: input.index,
      value: BigInt(cardanoInput.value),
      assets,
    };
  });

  return {
    id: "",
    inputs: mutatedInputs,
    outputs: mutatedOutputs,
    fee: BigInt(jsonTx.body.fee),
    metadata: metadata,
  };
};

/**
 * Tests for the Cardano chain functionality, focusing on transaction locking.
 *
 * Purpose:
 * 1. Ensure the extractor can correctly process and validate locking transactions.
 *
 * Edge Cases:
 * 1. Test with an invalid transaction setup and verify the extractor handles it appropriately.
 */
describe("Cardano Chain", () => {
  it("Produces valid Native Token Lock Tx", async () => {
    // 1. Instantiate Extractor
    const extractor = new CardanoRosenExtractor(
      cardanoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const cardanoToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain("cardano", "ada", "cardano");

    const cardanoInput: CardanoUtxo = generateCardanoUtxo(
      "e1227af0cd22abecd5c6439bc5d558bfae7643af7d300f2fe95cff723138dc52",
      1,
      "addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a",
      183845802n,
      [
        {
          policyId: rsBtc.policyId,
          assetName: rsBtc.assetName,
          quantity: 1000n,
        },
      ]
    );

    // 2. Create Lock Tx using ErgoRosenChain
    const tx = (await CardanoRosenSDK.generateLockTransaction(
      cardanoToken,
      "ergo",
      blockFrostRosenData.validAdaLock.toAddress,
      blockFrostRosenData.validAdaLock.fromAddress,
      BigInt(blockFrostRosenData.validAdaLock.amount),
      BigInt(blockFrostRosenData.validAdaLock.bridgeFee),
      BigInt(blockFrostRosenData.validAdaLock.networkFee),
      [cardanoInput].values(),
      cardanoContracts.addresses.lock
    )) as string;

    const extractableTx = convertTxHexStringToCardanoTx(tx, cardanoInput);
    const result = extractor.get(JsonBigInt.stringify(extractableTx));
    expect(result).toStrictEqual(blockFrostRosenData.validAdaLock);
  });

  it("Produces valid Token Lock Tx", async () => {
    // 1. Instantiate Extractor
    const extractor = new CardanoRosenExtractor(
      cardanoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const cardanoToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain("cardano", rsBtc.tokenId, "cardano");

    const cardanoInput: CardanoUtxo = generateCardanoUtxo(
      "e1227af0cd22abecd5c6439bc5d558bfae7643af7d300f2fe95cff723138dc52",
      1,
      "addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a",
      183845802n,
      [
        {
          policyId: rsBtc.policyId,
          assetName: rsBtc.assetName,
          quantity: 100000000n,
        },
      ]
    );

    // 2. Create Lock Tx using ErgoRosenChain
    const tx = (await CardanoRosenSDK.generateLockTransaction(
      cardanoToken,
      "ergo",
      blockFrostRosenData.validTokenLock.toAddress,
      blockFrostRosenData.validTokenLock.fromAddress,
      BigInt(blockFrostRosenData.validTokenLock.amount),
      BigInt(blockFrostRosenData.validTokenLock.bridgeFee),
      BigInt(blockFrostRosenData.validTokenLock.networkFee),
      [cardanoInput].values(),
      cardanoContracts.addresses.lock
    )) as string;

    const extractableTx = convertTxHexStringToCardanoTx(tx, cardanoInput);
    const result = extractor.get(JsonBigInt.stringify(extractableTx));
    expect(result).toStrictEqual(blockFrostRosenData.validTokenLock);
  });

  it("Throw InsufficientAssetsError when not enough funds", async () => {
    // 1. Instantiate Extractor
    const extractor = new CardanoRosenExtractor(
      cardanoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const cardanoToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain("cardano", rsBtc.tokenId, "cardano");

    const cardanoInput: CardanoUtxo = generateCardanoUtxo(
      "e1227af0cd22abecd5c6439bc5d558bfae7643af7d300f2fe95cff723138dc52",
      1,
      "addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a",
      183845802n,
      [
        {
          policyId: rsBtc.policyId,
          assetName: rsBtc.assetName,
          quantity: 100n,
        },
      ]
    );

    // 2. Throws error when generating lock transaction
    expect(
      async () =>
        await CardanoRosenSDK.generateLockTransaction(
          cardanoToken,
          "ergo",
          blockFrostRosenData.validTokenLock.toAddress,
          blockFrostRosenData.validTokenLock.fromAddress,
          BigInt(blockFrostRosenData.validTokenLock.amount),
          BigInt(blockFrostRosenData.validTokenLock.bridgeFee),
          BigInt(blockFrostRosenData.validTokenLock.networkFee),
          [cardanoInput].values(),
          cardanoContracts.addresses.lock
        )
    ).rejects.toThrowError(new InsufficientAssetsException());
  });
});
