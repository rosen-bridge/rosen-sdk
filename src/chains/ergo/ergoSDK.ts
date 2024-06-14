import { ErgoBoxCandidate } from "ergo-lib-wasm-nodejs";
import * as wasm from "ergo-lib-wasm-nodejs";
import { fee, minBoxValue } from "./consts";
import { AssetBalance, CoveringBoxes } from "../../types/utxoTypes";
import { SDKNetwork } from "../../utils/sdkNetwork";
import { BoxInfoExtractor } from "../../utils/boxInfo";
import { AssetBalanceMath } from "../../utils/assetBalanceMath";
import { RosenChainToken } from "@rosen-bridge/tokens";
import { staticImplements } from "../../utils/staticImplements";
import { ErgoBoxProxy } from "../../types/ergo/ergoBox";
import { UnsignedErgoTxProxy } from "../../types/ergo/eip-wallet-api";
import {
  InsufficientAssetsException,
  InvalidArgumentException,
} from "../../errors";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { LOCK_ADDRESSES } from "../../utils/lockAddresses";
import { IRosenSDK } from "../types/chainTypes";

@staticImplements<IRosenSDK>()
export class ErgoRosenSDK {
  /**
   * Creates a lock box with Rosen Tx Structure
   * - `toChain`: _string_, the target blockchain
   * - `toAddress`: _string_, the destination address in the target blockchain
   * - `networkFee`: _string_, the amount of network fee for this transfer
   * - `bridgeFee`: _string_, the amount of bridge fee for this transfer
   * - `fromAddress`: _string_, the address that is requesting the transfer
   * @param lockAddress
   * @param height
   * @param tokenId
   * @param amount
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param bridgeFee
   * @param networkFee
   */
  static createLockBox(
    lockAddress: string,
    height: number,
    tokenId: string,
    amount: bigint,
    toChain: string,
    toAddress: string,
    fromAddress: string,
    bridgeFee: bigint,
    networkFee: bigint
  ): ErgoBoxCandidate {
    /**
     * TODO: fix ergo native token id
     * local:ergo/rosen-bridge/ui#100
     */
    const boxErgValue = tokenId === "erg" ? amount : minBoxValue;
    const lockBox = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(boxErgValue.toString())),
      wasm.Contract.pay_to_address(wasm.Address.from_base58(lockAddress)),
      height
    );

    lockBox.set_register_value(
      wasm.NonMandatoryRegisterId.R4,
      wasm.Constant.from_coll_coll_byte([
        Buffer.from(toChain.toString()),
        Buffer.from(toAddress.toString()),
        Buffer.from(networkFee.toString()),
        Buffer.from(bridgeFee.toString()),
        Buffer.from(fromAddress.toString()),
      ])
    );

    /**
     * TODO: fix ergo native token id
     * local:ergo/rosen-bridge/ui#100
     */
    if (tokenId !== "erg") {
      lockBox.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(amount.toString()))
      );
    }
    return lockBox.build();
  }

  /**
   * generates an unsigned lock transaction on Ergo
   * @param changeAddress
   * @param lockAddress
   * @param utxoIterator
   * @param toChain
   * @param toAddress
   * @param tokenId
   * @param amount
   * @param bridgeFee
   * @param networkFee
   */
  static async generateLockTransaction(
    token: RosenChainToken,
    toChain: string,
    toAddress: string,
    changeAddress: string,
    amount: bigint,
    bridgeFee: bigint,
    networkFee: bigint,
    utxoIterator:
      | AsyncIterator<ErgoBoxProxy, undefined>
      | Iterator<ErgoBoxProxy, undefined>,
    lockAddress: string = LOCK_ADDRESSES.ergo,
    height: number = -1,
    logger?: AbstractLogger
  ): Promise<wasm.UnsignedTransaction> {
    if (
      (utxoIterator as AsyncIterator<ErgoBoxProxy, undefined>) === null ||
      (utxoIterator as Iterator<ErgoBoxProxy, undefined>) === null
    ) {
      throw new InvalidArgumentException(
        "[Generate Lock Transaction] UtxoIterator does not have ErgoBoxProxy"
      );
    }

    var networkHeight = height;
    if (height === -1) {
      networkHeight = await SDKNetwork.getHeight("ergo");
    } else {
      networkHeight = height;
    }
    const tokenId = token.tokenId;

    // generate lock box
    const lockAssets: AssetBalance = {
      nativeToken: minBoxValue,
      tokens: [],
    };

    if (tokenId === "erg") {
      /**
       * TODO: fix ergo native token name
       * local:ergo/rosen-bridge/ui#100
       */
      lockAssets.nativeToken = amount;
    } else {
      // lock token
      lockAssets.tokens.push({ id: tokenId, value: amount });
    }

    const lockBox = this.createLockBox(
      lockAddress,
      networkHeight,
      tokenId,
      amount,
      toChain,
      toAddress,
      changeAddress,
      bridgeFee,
      networkFee
    );

    // calculate required assets to get input boxes
    const requiredAssets = AssetBalanceMath.sum(lockAssets, {
      nativeToken: minBoxValue + fee,
      tokens: [],
    });

    // get input boxes
    const inputs = await this.getCoveringBoxes(
      requiredAssets,
      [],
      new Map(),
      utxoIterator
    );
    if (!inputs.covered) throw new InsufficientAssetsException();
    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    // add input boxes to transaction
    const unsignedInputs = new wasm.UnsignedInputs();
    inputs.boxes.forEach((box) => {
      unsignedInputs.add(
        wasm.UnsignedInput.from_box_id(wasm.BoxId.from_str(box.boxId))
      );
      inputAssets = AssetBalanceMath.sum(
        inputAssets,
        BoxInfoExtractor.getAssetBalance(box)
      );
    });

    // calculate change box assets and transaction fee
    const changeAssets = AssetBalanceMath.subtract(inputAssets, lockAssets);
    changeAssets.nativeToken -= fee;
    const changeBox = this.createChangeBox(
      changeAddress,
      networkHeight,
      changeAssets
    );
    const feeBox = wasm.ErgoBoxCandidate.new_miner_fee_box(
      wasm.BoxValue.from_i64(wasm.I64.from_str(fee.toString())),
      networkHeight
    );

    const txOutputs = new wasm.ErgoBoxCandidates(lockBox);
    txOutputs.add(changeBox);
    txOutputs.add(feeBox);

    return new wasm.UnsignedTransaction(
      unsignedInputs,
      new wasm.DataInputs(),
      txOutputs
    );
  }

  // <utils>
  /**
   * creates change box candidate
   * @param changeAddress
   * @param height
   * @param balance
   * @returns
   */
  private static createChangeBox(
    changeAddress: string,
    height: number,
    balance: AssetBalance
  ): wasm.ErgoBoxCandidate {
    const changeBox = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(balance.nativeToken.toString())),
      wasm.Contract.pay_to_address(wasm.Address.from_base58(changeAddress)),
      height
    );

    balance.tokens.forEach((token) => {
      changeBox.add_token(
        wasm.TokenId.from_str(token.id),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString()))
      );
    });
    return changeBox.build();
  }

  /**
   * select useful boxes for an address until required assets are satisfied
   * @param requiredAssets the required assets
   * @param forbiddenBoxIds the id of forbidden boxes
   * @param trackMap the mapping of a box id to it's next box
   * @param boxIterator an iterator with boxes
   * @returns an object containing the selected boxes with a boolean showing if requirements covered or not
   */
  private static async getCoveringBoxes(
    requiredAssets: AssetBalance,
    forbiddenBoxIds: Array<string>,
    trackMap: Map<string, ErgoBoxProxy | undefined>,
    boxIterator:
      | Iterator<ErgoBoxProxy, undefined>
      | AsyncIterator<ErgoBoxProxy, undefined>
  ): Promise<CoveringBoxes> {
    let uncoveredNativeToken = requiredAssets.nativeToken;
    const uncoveredTokens = requiredAssets.tokens.filter(
      (info) => info.value > 0n
    );

    const isRequirementRemaining = () => {
      return uncoveredTokens.length > 0 || uncoveredNativeToken > 0n;
    };

    let offset = 0;
    const result: Array<ErgoBoxProxy> = [];

    // get boxes until requirements are satisfied
    while (isRequirementRemaining()) {
      const iteratorResponse = await boxIterator.next();

      // end process if there are no more boxes
      if (iteratorResponse.done) break;

      let trackedBox: ErgoBoxProxy | undefined = iteratorResponse.value;
      let boxInfo = BoxInfoExtractor.getBoxInfo(trackedBox);

      // track boxes
      let skipBox = false;
      while (trackMap.has(boxInfo.id)) {
        trackedBox = trackMap.get(boxInfo.id);
        if (!trackedBox) {
          skipBox = true;
          break;
        }
        const previousBoxId = boxInfo.id;
        boxInfo = BoxInfoExtractor.getBoxInfo(trackedBox);
      }

      // if tracked to no box or forbidden box, skip it
      if (skipBox || forbiddenBoxIds.includes(boxInfo.id)) {
        continue;
      }

      // check and add if box assets are useful to requirements
      let isUseful = false;
      boxInfo.assets.tokens.forEach((boxToken) => {
        const tokenIndex = uncoveredTokens.findIndex(
          (requiredToken) => requiredToken.id === boxToken.id
        );
        if (tokenIndex !== -1) {
          isUseful = true;
          const token = uncoveredTokens[tokenIndex];
          if (token.value > boxToken.value) token.value -= boxToken.value;
          else uncoveredTokens.splice(tokenIndex, 1);
        }
      });
      if (isUseful || uncoveredNativeToken > 0n) {
        uncoveredNativeToken -=
          uncoveredNativeToken >= boxInfo.assets.nativeToken
            ? boxInfo.assets.nativeToken
            : uncoveredNativeToken;
        result.push(trackedBox!);
      }
    }

    return {
      covered: !isRequirementRemaining(),
      boxes: result,
    };
  }

  /**
   * converts wasm UnsignedTransaction to UnsignedErgoTxProxy format
   * @param unsignedTx
   * @param inputs
   * @returns
   */
  private static unsignedTransactionToProxy = (
    unsignedTx: wasm.UnsignedTransaction,
    inputs: ErgoBoxProxy[]
  ): UnsignedErgoTxProxy => {
    const unsignedErgoTxProxy = unsignedTx.to_js_eip12();
    unsignedErgoTxProxy.inputs = inputs.map((box) => {
      return {
        ...box,
        extension: {},
      };
    });
    return unsignedErgoTxProxy;
  };
  // </utils>
}
