import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import {
  ChainFee,
  ChainMinimumFee,
  ErgoNetworkType,
  Fee,
  MinimumFeeBox,
} from "@rosen-bridge/minimum-fee";

export class MockMinimumFeeBox extends MinimumFeeBox {
  constructor(
    tokenId: string,
    minimumFeeNFT: string,
    networkType: ErgoNetworkType,
    networkUrl: string,
    logger?: AbstractLogger
  ) {
    super(tokenId, minimumFeeNFT, networkType, networkUrl, logger);
  }

  fetchBox = async (): Promise<boolean> => {
    this.box = {} as ErgoBox; // Mocking the box fetch
    return true; // Mocking successful fetch
  };

  protected selectEligibleBox = (eligibleBoxes: Array<ErgoBox>): ErgoBox => {
    if (eligibleBoxes.length !== 1) {
      throw new Error("Mock: More than one eligible box found");
    }
    return eligibleBoxes[0]; // Mocking selection of the first eligible box
  };

  protected fetchBoxesUsingExplorer = async (): Promise<Array<ErgoBox>> => {
    return [{} as ErgoBox]; // Mocking fetch with a single box
  };

  protected fetchBoxesUsingNode = async (): Promise<Array<ErgoBox>> => {
    return [{} as ErgoBox]; // Mocking fetch with a single box
  };

  getBox = (): ErgoBox | undefined => {
    return this.box; // Returning the mocked box
  };

  getFee = (
    fromChain: string,
    height: number,
    toChain: string
  ): ChainMinimumFee => {
    const mockChainFee: ChainFee = {
      bridgeFee: BigInt(1000),
      networkFee: BigInt(500),
      rsnRatio: BigInt(1),
      rsnRatioDivisor: BigInt(100),
      feeRatio: BigInt(2),
    };
    return new ChainMinimumFee(mockChainFee); // Mocking the fee
  };

  protected extractFeeFromBox = (box: ErgoBox): Array<Fee> => {
    return [
      {
        heights: { "0": 0 },
        configs: {
          "0": {
            bridgeFee: BigInt(1000),
            networkFee: BigInt(500),
            rsnRatio: BigInt(1),
            rsnRatioDivisor: BigInt(100),
            feeRatio: BigInt(2),
          },
        },
      },
    ]; // Mocking fee extraction
  };
}
