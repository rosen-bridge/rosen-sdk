import { ErgoBoxCandidate } from "ergo-lib-wasm-nodejs";
import * as wasm from "ergo-lib-wasm-nodejs";
import { fee, minBoxValue } from "./consts";
import { AssetBalance } from "../../types/utxoTypes";
import { SDKNetwork } from "../../utils/sdkNetwork";
import { BoxInfoExtractor } from "../../utils/boxInfo";
import { AssetBalanceMath } from "../../utils/assetBalanceMath";
import { RosenChainToken } from "@rosen-bridge/tokens";
import {
  InsufficientAssetsException,
  InvalidArgumentException,
} from "../../errors";
import { AbstractLogger } from "@rosen-bridge/abstract-logger";
import { ErgoBoxProxy } from "@rosen-ui/wallet-api";
import { selectErgoBoxes } from "@rosen-bridge/ergo-box-selection";

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
    lockAddress: string,
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

    // Provide user with the option to put in a height, or get
    // with latest height.
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
    const inputs = await selectErgoBoxes(
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
}
