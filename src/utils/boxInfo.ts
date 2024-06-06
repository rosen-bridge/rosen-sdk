import { CardanoUtxo } from "@rosen-bridge/cardano-utxo-selection";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";
import { AssetBalance, BoxInfo } from "../types/utxoTypes";
import { InvalidArgumentException } from "../errors";

export class BoxInfoExtractor {
  private static isCardanoUtxo(
    box: CardanoUtxo | ErgoBoxProxy
  ): box is CardanoUtxo {
    const cardanoBox = box as CardanoUtxo;
    return (
      cardanoBox.txId !== undefined &&
      cardanoBox.address !== undefined &&
      cardanoBox.assets !== undefined &&
      cardanoBox.value !== undefined &&
      cardanoBox.index !== undefined
    );
  }

  private static isErgoBoxProxy(
    box: CardanoUtxo | ErgoBoxProxy
  ): box is ErgoBoxProxy {
    const ergoBox = box as ErgoBoxProxy;
    return (
      ergoBox.ergoTree !== undefined &&
      ergoBox.additionalRegisters !== undefined &&
      ergoBox.assets !== undefined &&
      ergoBox.boxId !== undefined &&
      ergoBox.transactionId !== undefined &&
      ergoBox.value !== undefined &&
      ergoBox.creationHeight !== undefined
    );
  }

  /**
   * converts CardanoUtxo assets to AssetBalance
   * @param utxo
   * @returns
   */
  public static getAssetBalance(box: CardanoUtxo | ErgoBoxProxy): AssetBalance {
    if (this.isCardanoUtxo(box)) {
      return {
        nativeToken: BigInt(box.value),
        tokens: box.assets.map((asset) => ({
          id: `${asset.policyId}.${asset.assetName}`,
          value: asset.quantity,
        })),
      };
    } else if (this.isErgoBoxProxy(box)) {
      return {
        nativeToken: BigInt(box.value),
        tokens: box.assets.map((token) => {
          return {
            id: token.tokenId,
            value: BigInt(token.amount),
          };
        }),
      };
    } else {
      throw new InvalidArgumentException(
        "Expect ErgoBoxProxy or CardanoUtxo only"
      );
    }
  }

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  public static getBoxInfo(box: ErgoBoxProxy): BoxInfo {
    if (!this.isErgoBoxProxy(box)) {
      throw new InvalidArgumentException("Box is not an ErgoBoxProxy type");
    }

    return {
      id: box.boxId,
      assets: {
        nativeToken: BigInt(box.value),
        tokens: box.assets.map((token) => ({
          id: token.tokenId,
          value: BigInt(token.amount),
        })),
      },
    };
  }
}
