import { describe, it, expect } from "vitest";
import * as wasm from "@emurgo/cardano-serialization-lib-nodejs";
import tokens from "../assets/test-rosen-loen-tokens.json";
import cardanoContracts from "../assets/test-cardano-loen-contracts.json";
import { CardanoRosenExtractor } from "@rosen-bridge/rosen-extractor";
import { CardanoRosenSDK, RosenUserInterface } from "../../src";
import { LoenRosenSDKConfig, testRSNRatioNFT } from "../testConfig";
import { ErgoNetworkType } from "@rosen-bridge/minimum-fee";
import { ERGO_EXPLORER_URL } from "../../src/constants/constants";
import { blockFrostRosenData, fromAddressCardanoHex } from "./mockData";
import {
  CardanoAsset,
  CardanoUtxo,
} from "@rosen-bridge/cardano-utxo-selection";
import JsonBigInt from "@rosen-bridge/json-bigint";

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

/**
 * We need to test to see if the lock txs are valid:
 * 1. Whether the extractor can extract it
 *
 * Edge cases:
 * 1. Create an invalid/failing tests and try to extract with extractor
 */
describe("Cardano Chain", () => {
  it("Produces valid Lock Tx", async () => {
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
      []
    );

    // 2. Create Lock Tx using ErgoRosenChain
    const tx = (await CardanoRosenSDK.generateLockTransaction(
      cardanoToken,
      "ergo",
      blockFrostRosenData.validAdaLock.toAddress,
      fromAddressCardanoHex,
      BigInt(blockFrostRosenData.validAdaLock.amount),
      BigInt(blockFrostRosenData.validAdaLock.bridgeFee),
      BigInt(blockFrostRosenData.validAdaLock.networkFee),
      [cardanoInput].values(),
      cardanoContracts.addresses.lock
    )) as string;

    const validTx = wasm.Transaction.from_hex(tx);
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
      return {
        address: output.address,
        value: BigInt(output.amount.coin),
        assets: [],
      };
    });

    const mutatedInputs = jsonTx.body.inputs.map((input: any) => {
      return {
        txId: input.transaction_id,
        index: input.index,
        value: BigInt(cardanoInput.value),
        assets: [],
      };
    });
    const extractableTx = {
      id: "",
      inputs: mutatedInputs,
      outputs: mutatedOutputs,
      fee: BigInt(jsonTx.body.fee),
      metadata: metadata,
    };
    const result = extractor.get(JsonBigInt.stringify(extractableTx));
    expect(result).toStrictEqual(blockFrostRosenData.validAdaLock);
  });
});
