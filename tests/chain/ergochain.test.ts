import { describe, it, expect } from "vitest";
import tokens from "../assets/test-rosen-loen-tokens.json";
import ergoContracts from "../assets/test-ergo-loen-contracts.json";
import { LoenRosenSDKConfig, testRSNRatioNFT } from "../testConfig";
import { ErgoRosenSDK, RosenUserInterface } from "../../src";
import { ErgoNetworkType } from "@rosen-bridge/minimum-fee";
import { ERGO_EXPLORER_URL } from "../../src/constants/constants";
import { ErgoBoxProxy } from "../../src/types/ergo/ergoBox";
import { TokenAmountProxy } from "../../src/types/ergo/tokenAmount";
import { Registers } from "../../src/types/ergo/registers";
import { ErgoRosenExtractor } from "@rosen-bridge/rosen-extractor";
import { Transaction, UnsignedTransaction } from "ergo-lib-wasm-nodejs";
import { mockInputBox, ergoRosenData } from "./mockData";

const generateErgoBoxProxy = (
  boxId: string,
  transactionId: string,
  index: number,
  ergoTree: string,
  creationHeight: number,
  value: string,
  assets: TokenAmountProxy[],
  additionalRegisters: Registers
): ErgoBoxProxy => {
  return {
    boxId,
    transactionId,
    index,
    ergoTree,
    creationHeight,
    value,
    assets,
    additionalRegisters,
  };
};

describe("Ergo Chain", () => {
  it("Produces valid Lock Tx", async () => {
    // 1. Instantiate Extractor
    const extractor = new ErgoRosenExtractor(
      ergoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const ergoToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain("ergo", "erg", "ergo");

    // 2. Create Lock Tx using ErgoRosenChain
    const { trueBox } = mockInputBox;
    const mockBox1: ErgoBoxProxy = generateErgoBoxProxy(
      trueBox.boxId,
      "",
      trueBox.index,
      trueBox.ergoTree,
      trueBox.creationHeight,
      trueBox.value.toString(),
      [],
      {}
    );
    const networkHeight = 1285925;

    const unsignedErgoTx = (await ErgoRosenSDK.generateLockTransaction(
      ergoToken,
      "cardano",
      ergoRosenData.lockTx.toAddress,
      ergoRosenData.lockTx.fromAddress,
      BigInt(ergoRosenData.lockTx.amount),
      BigInt(ergoRosenData.lockTx.bridgeFee),
      BigInt(ergoRosenData.lockTx.networkFee),
      [mockBox1].values(),
      ergoContracts.addresses.lock,
      networkHeight
    )) as UnsignedTransaction;

    const serializedTx: Uint8Array = Transaction.from_unsigned_tx(
      unsignedErgoTx,
      [new Uint8Array()]
    ).sigma_serialize_bytes();
    const serializedTxString = Buffer.from(serializedTx).toString("hex");

    const result = extractor.get(serializedTxString);
    expect(result).toStrictEqual(ergoRosenData.lockTx);
  });
});
