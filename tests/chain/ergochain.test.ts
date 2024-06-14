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
import { InsufficientAssetsException } from "../../src/errors";

const rsBtc = {
  tokenId: "98bc813d77b8b938fddb08f75c5c686ffe38cf1d99a887f91403cc6f0c5c76bf",
  name: "rsBTC-loen",
  decimals: 8,
};

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
  it("Produces valid Native Token Lock Tx", async () => {
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

    // 2. Generate Input Box for lock transaction
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

    // 3. Create Lock Tx using ErgoRosenChain
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

    // 4. Compare results
    const result = extractor.get(serializedTxString);
    expect(result).toStrictEqual(ergoRosenData.lockTx);
  });

  it("Produces valid Token Lock Tx", async () => {
    // 1. Instantiate Extractor
    const extractor = new ErgoRosenExtractor(
      ergoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const btcToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain(
      "ergo",
      "98bc813d77b8b938fddb08f75c5c686ffe38cf1d99a887f91403cc6f0c5c76bf",
      "ergo"
    );

    // 2. Generate Input Box for lock transaction
    const { trueBox } = mockInputBox;
    const mockBox1: ErgoBoxProxy = generateErgoBoxProxy(
      trueBox.boxId,
      "",
      trueBox.index,
      trueBox.ergoTree,
      trueBox.creationHeight,
      trueBox.value.toString(),
      [
        {
          tokenId: rsBtc.tokenId,
          name: rsBtc.name,
          decimals: rsBtc.decimals,
          amount: "10000000000",
        },
      ],
      {}
    );
    const networkHeight = 1285925;

    // 3. Create Lock Tx using ErgoRosenChain
    const unsignedErgoTx = (await ErgoRosenSDK.generateLockTransaction(
      btcToken,
      "cardano",
      ergoRosenData.bitcoinTx.toAddress,
      ergoRosenData.bitcoinTx.fromAddress,
      BigInt(ergoRosenData.bitcoinTx.amount),
      BigInt(ergoRosenData.bitcoinTx.bridgeFee),
      BigInt(ergoRosenData.bitcoinTx.networkFee),
      [mockBox1].values(),
      ergoContracts.addresses.lock,
      networkHeight
    )) as UnsignedTransaction;

    const serializedTx: Uint8Array = Transaction.from_unsigned_tx(
      unsignedErgoTx,
      [new Uint8Array()]
    ).sigma_serialize_bytes();
    const serializedTxString = Buffer.from(serializedTx).toString("hex");

    // 4. Compare results
    const result = extractor.get(serializedTxString);
    expect(result).toStrictEqual(ergoRosenData.bitcoinTx);
  });

  it("Throws error when insufficient balance", async () => {
    // 1. Instantiate Extractor
    const extractor = new ErgoRosenExtractor(
      ergoContracts.addresses.lock,
      // @ts-ignore
      tokens
    );

    const btcToken = new RosenUserInterface(
      //@ts-ignore
      tokens,
      testRSNRatioNFT,
      ErgoNetworkType.explorer,
      ERGO_EXPLORER_URL,
      LoenRosenSDKConfig
    ).getTokenDetailsOnTargetChain(
      "ergo",
      "98bc813d77b8b938fddb08f75c5c686ffe38cf1d99a887f91403cc6f0c5c76bf",
      "ergo"
    );

    // 2. Generate input boxes
    const { trueBox } = mockInputBox;
    const mockBox1: ErgoBoxProxy = generateErgoBoxProxy(
      trueBox.boxId,
      "",
      trueBox.index,
      trueBox.ergoTree,
      trueBox.creationHeight,
      trueBox.value.toString(),
      [
        {
          tokenId: rsBtc.tokenId,
          name: rsBtc.name,
          decimals: rsBtc.decimals,
          amount: "100",
        },
      ],
      {}
    );
    const networkHeight = 1285925;

    // 3. Throws error when generating lock tx
    await expect(
      async () =>
        await ErgoRosenSDK.generateLockTransaction(
          btcToken,
          "cardano",
          ergoRosenData.bitcoinTx.toAddress,
          ergoRosenData.bitcoinTx.fromAddress,
          BigInt(ergoRosenData.bitcoinTx.amount),
          BigInt(ergoRosenData.bitcoinTx.bridgeFee),
          BigInt(ergoRosenData.bitcoinTx.networkFee),
          [mockBox1].values(),
          ergoContracts.addresses.lock,
          networkHeight
        )
    ).rejects.toThrowError(new InsufficientAssetsException());
  });
});
