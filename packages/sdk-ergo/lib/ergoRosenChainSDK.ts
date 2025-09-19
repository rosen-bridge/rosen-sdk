import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { TokenMap } from '@rosen-bridge/tokens';
import {
  AbstractRosenChainSDK,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import * as wasm from 'ergo-lib-wasm-nodejs';
import {
  AssetBalance,
  ErgoBoxSelection,
} from '@rosen-bridge/ergo-box-selection';
import { FEE, MIN_BOX_VALUE } from './constants';
import { NATIVE_TOKEN_IDS, NETWORKS } from '@rosen-bridge/sdk-constant';
import {
  NetworkParams,
  UnsignedErgoTxProxy,
  UnsignedGenerateTxProxy,
} from './types';

class ErgoRosenChainSDK extends AbstractRosenChainSDK<
  UnsignedGenerateTxProxy,
  wasm.ErgoBox,
  NetworkParams
> {
  CHAIN = NETWORKS.ERGO;

  constructor(
    protected tokenMap: TokenMap,
    lockAddress: string,
    protected minBoxValue: bigint = MIN_BOX_VALUE,
    protected txFee: bigint = FEE,
    protected logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  /**
   * generates an unsigned lock transaction on Ergo
   * @param tokenId
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param unwrappedAmount
   * @param wrappedBridgeFee
   * @param wrappedNetworkFee
   * @param utxoIterator
   * @param networkParams
   * @return UnsignedGenerateTxProxy
   */
  protected generateLockTransactionCore = async (
    tokenId: string,
    toChain: NETWORKS,
    toAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<wasm.ErgoBox, undefined>
      | Iterator<wasm.ErgoBox, undefined>,
    networkParams: NetworkParams,
  ): Promise<UnsignedGenerateTxProxy> => {
    // generate lock box
    const lockAssets: AssetBalance = {
      nativeToken: this.minBoxValue,
      tokens: [],
    };
    if (tokenId === NATIVE_TOKEN_IDS.ergo) {
      lockAssets.nativeToken = unwrappedAmount;
    } else {
      // lock token
      lockAssets.tokens.push({ id: tokenId, value: unwrappedAmount });
    }

    const lockBox = this.createLockBox(
      networkParams.networkHeight,
      tokenId,
      unwrappedAmount,
      toChain,
      toAddress,
      fromAddress,
      wrappedBridgeFee,
      wrappedNetworkFee,
    );

    const selector = new ErgoBoxSelection(this.logger);

    // get input boxes
    const selectedBoxes = await selector.getCoveringBoxes(
      lockAssets,
      [],
      new Map(),
      utxoIterator,
      this.minBoxValue,
      undefined,
      () => this.txFee,
    );
    if (!selectedBoxes.covered)
      throw new InsufficientAssetsException(selectedBoxes.uncoveredAssets);

    // add input boxes to transaction
    const unsignedInputs = new wasm.UnsignedInputs();
    selectedBoxes.boxes.forEach((box) => {
      unsignedInputs.add(
        wasm.UnsignedInput.from_box_id(
          wasm.BoxId.from_str(box.box_id().to_str()),
        ),
      );
    });

    const feeBox = wasm.ErgoBoxCandidate.new_miner_fee_box(
      wasm.BoxValue.from_i64(
        wasm.I64.from_str(selectedBoxes.additionalAssets.fee.toString()),
      ),
      networkParams.networkHeight,
    );

    const txOutputs = new wasm.ErgoBoxCandidates(lockBox);

    selectedBoxes.additionalAssets.list.forEach((item) => {
      txOutputs.add(
        this.createChangeBox(fromAddress, networkParams.networkHeight, item),
      );
    });

    txOutputs.add(feeBox);

    const unsignedTx = new wasm.UnsignedTransaction(
      unsignedInputs,
      new wasm.DataInputs(),
      txOutputs,
    );

    const unsignedTxProxy = this.unsignedTransactionToProxy(
      unsignedTx,
      selectedBoxes.boxes,
    );
    const inputsSigmaBytes = selectedBoxes.boxes.map((box) =>
      Buffer.from(box.sigma_serialize_bytes()).toString('hex'),
    );
    const dataInputsSigmaBytes: string[] = []; // The Rosen lock transaction doesn’t require dataInputs

    return {
      unsignedTxProxy,
      inputsSigmaBytes,
      dataInputsSigmaBytes,
    };
  };

  /**
   * creates lock box candidate
   * @param height
   * @param tokenId
   * @param unwrappedAmount
   * @param toChain
   * @param toAddress
   * @param fromAddress
   * @param bridgeFee
   * @param networkFee
   * @return ErgoBoxCandidate
   */
  createLockBox = (
    height: number,
    tokenId: string,
    unwrappedAmount: bigint,
    toChain: string,
    toAddress: string,
    fromAddress: string,
    bridgeFee: bigint,
    networkFee: bigint,
  ): wasm.ErgoBoxCandidate => {
    const boxErgValue =
      tokenId === NATIVE_TOKEN_IDS.ergo ? unwrappedAmount : this.minBoxValue;
    const lockBox = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(boxErgValue.toString())),
      wasm.Contract.pay_to_address(wasm.Address.from_base58(this.lockAddress)),
      height,
    );

    lockBox.set_register_value(
      wasm.NonMandatoryRegisterId.R4,
      wasm.Constant.from_coll_coll_byte([
        Buffer.from(toChain.toString()),
        Buffer.from(toAddress.toString()),
        Buffer.from(networkFee.toString()),
        Buffer.from(bridgeFee.toString()),
        Buffer.from(fromAddress.toString()),
      ]),
    );

    if (tokenId !== NATIVE_TOKEN_IDS.ergo) {
      lockBox.add_token(
        wasm.TokenId.from_str(tokenId),
        wasm.TokenAmount.from_i64(
          wasm.I64.from_str(unwrappedAmount.toString()),
        ),
      );
    }
    return lockBox.build();
  };

  /**
   * creates change box candidate
   *
   * THIS FUNCTION WORKS WITH UNWRAPPED VALUES
   *
   * @param changeAddress
   * @param height
   * @param balance
   * @returns ErgoBoxCandidate
   */
  createChangeBox = (
    changeAddress: string,
    height: number,
    balance: AssetBalance,
  ): wasm.ErgoBoxCandidate => {
    const changeBox = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(wasm.I64.from_str(balance.nativeToken.toString())),
      wasm.Contract.pay_to_address(wasm.Address.from_base58(changeAddress)),
      height,
    );

    balance.tokens.forEach((token) => {
      changeBox.add_token(
        wasm.TokenId.from_str(token.id),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString())),
      );
    });
    return changeBox.build();
  };

  /**
   * converts wasm UnsignedTransaction to UnsignedErgoTxProxy format
   * @param unsignedTx
   * @param inputs
   * @returns UnsignedErgoTxProxy
   */
  unsignedTransactionToProxy = (
    unsignedTx: wasm.UnsignedTransaction,
    inputs: wasm.ErgoBox[],
  ): UnsignedErgoTxProxy => {
    const unsignedErgoTxProxy = unsignedTx.to_js_eip12();
    unsignedErgoTxProxy.inputs = inputs.map((box) => {
      return {
        ...box.to_js_eip12(),
        extension: {},
      };
    });
    return unsignedErgoTxProxy;
  };
}

export default ErgoRosenChainSDK;
