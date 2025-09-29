import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { TokenMap } from '@rosen-bridge/tokens';
import {
  AbstractRosenChainSDK,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import {
  SEGWIT_INPUT_WEIGHT_UNIT,
  SEGWIT_OUTPUT_WEIGHT_UNIT,
} from './constants';
import {
  NATIVE_TOKEN_IDS,
  NETWORKS,
  NETWORKS_INDEX,
} from '@rosen-bridge/sdk-constant';
import { NetworkParams, UnsignedPsbtData } from './types';
import {
  AssetBalance,
  BitcoinBoxSelection,
  BitcoinUtxo,
  generateFeeEstimator,
} from '@rosen-bridge/bitcoin-utxo-selection';
import { Psbt, address, payments } from 'bitcoinjs-lib';
import { UnsupportedAddress, UnsupportedTokenException } from './errors';

class BitcoinRosenChainSDK extends AbstractRosenChainSDK<
  UnsignedPsbtData,
  BitcoinUtxo,
  NetworkParams
> {
  CHAIN = NETWORKS.BITCOIN;

  constructor(
    protected tokenMap: TokenMap,
    lockAddress: string,
    protected logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  /**
   * generates an unsigned lock transaction on Bitcoin
   * @param tokenId only btc (native token) is supported
   * @param toChain
   * @param toEncodedAddress encoded address of the recipient on the target chain (to encoded destination address,
   *                         you can use `encodeAddress` function of package @rosen-bridge/address-codec)
   * @param fromAddress
   * @param unwrappedAmount
   * @param wrappedBridgeFee
   * @param wrappedNetworkFee
   * @param utxoIterator
   * @param networkParams
   * @return UnsignedPsbtData
   */
  protected generateLockTransactionCore = async (
    tokenId: string = NATIVE_TOKEN_IDS.bitcoin,
    toChain: NETWORKS,
    toEncodedAddress: string,
    fromAddress: string,
    unwrappedAmount: bigint,
    wrappedBridgeFee: bigint,
    wrappedNetworkFee: bigint,
    utxoIterator:
      | AsyncIterator<BitcoinUtxo, undefined>
      | Iterator<BitcoinUtxo, undefined>,
    networkParams: NetworkParams,
  ): Promise<UnsignedPsbtData> => {
    if (tokenId !== NATIVE_TOKEN_IDS.bitcoin)
      throw new UnsupportedTokenException(tokenId);

    const isValid = fromAddress.toLowerCase().startsWith('bc1q');
    if (!isValid) throw new UnsupportedAddress();

    // generate txBuilder
    const psbt = new Psbt();

    const opReturnData = this.generateOpReturnData(
      toChain,
      toEncodedAddress,
      wrappedNetworkFee,
      wrappedBridgeFee,
    );
    // generate OP_RETURN box
    const opReturnPayment = payments.embed({
      data: [Buffer.from(opReturnData, 'hex')],
    });
    psbt.addOutput({
      script: opReturnPayment.output!,
      value: 0,
    });

    // generate lock box
    const lockPayment = payments.p2wpkh({
      address: this.lockAddress,
    });
    psbt.addOutput({
      script: lockPayment.output!,
      value: Number(unwrappedAmount),
    });

    const minSatoshi = this.getMinimumMeaningfulSatoshi(networkParams.feeRatio);

    // generate fee estimator
    const estimateFee = generateFeeEstimator(
      1,
      42, // all txs include 40W. P2WPKH txs need additional 2W
      SEGWIT_INPUT_WEIGHT_UNIT,
      SEGWIT_OUTPUT_WEIGHT_UNIT,
      networkParams.feeRatio,
      4, // the virtual size matters for fee estimation of native-segwit transactions
    );

    const lockAssets: AssetBalance = {
      nativeToken: unwrappedAmount + minSatoshi,
      tokens: [],
    };

    const selector = new BitcoinBoxSelection();
    const selectedBoxes = await selector.getCoveringBoxes(
      lockAssets,
      [],
      new Map(),
      utxoIterator,
      minSatoshi,
      undefined,
      estimateFee,
    );
    if (!selectedBoxes.covered) {
      throw new InsufficientAssetsException(selectedBoxes.uncoveredAssets);
    }

    // add inputs
    const fromAddressScript = address.toOutputScript(fromAddress);
    selectedBoxes.boxes.forEach((box) => {
      psbt.addInput({
        hash: box.txId,
        index: box.index,
        witnessUtxo: {
          script: fromAddressScript,
          value: Number(box.value),
        },
      });
    });

    // calculate input boxes assets
    let remainingBtc =
      selectedBoxes.boxes.reduce((a, b) => a + b.value, 0n) - unwrappedAmount;

    // create change output
    const estimatedFee = this.estimateTxFee(
      psbt.txInputs.length,
      psbt.txOutputs.length + 1,
      networkParams.feeRatio,
    );
    remainingBtc -= estimatedFee;
    psbt.addOutput({
      script: fromAddressScript,
      value: Number(remainingBtc),
    });

    return {
      psbt: {
        base64: psbt.toBase64(),
        hex: psbt.toHex(),
      },
      inputSize: psbt.inputCount,
    };
  };

  /**
   * generates metadata for lock transaction
   * @param toChain
   * @param addressHex
   * @param networkFee
   * @param bridgeFee
   * @returns
   */
  generateOpReturnData = (
    toChain: NETWORKS,
    addressHex: string,
    networkFee: bigint,
    bridgeFee: bigint,
  ): string => {
    const toChainHex = NETWORKS_INDEX[toChain].toString(16).padStart(2, '0');
    // parse bridgeFee
    const bridgeFeeHex = bridgeFee.toString(16).padStart(16, '0');
    // parse networkFee
    const networkFeeHex = networkFee.toString(16).padStart(16, '0');
    // parse toAddress
    const addressLengthCode = (addressHex.length / 2)
      .toString(16)
      .padStart(2, '0');

    return (
      toChainHex + bridgeFeeHex + networkFeeHex + addressLengthCode + addressHex
    );
  };

  /**
   * gets the minimum amount of satoshi for a utxo that can cover
   * additional fee for adding it to a tx
   * @returns the minimum UNWRAPPED-VALUE amount
   */
  getMinimumMeaningfulSatoshi = (feeRatio: number): bigint => {
    return BigInt(
      Math.ceil(
        (feeRatio * SEGWIT_INPUT_WEIGHT_UNIT) / 4, // estimate fee per weight and convert to virtual size
      ),
    );
  };

  /**
   * estimates required fee for tx based on number of inputs, outputs and current network fee ratio
   * inputs and outputs required fee are estimated by segwit weight unit
   * @param inputSize
   * @param outputSize
   * @param feeRatio
   */
  estimateTxFee = (
    inputSize: number,
    outputSize: number,
    feeRatio: number,
  ): bigint => {
    const txBaseWeight = 40 + 2; // all txs include 40W. P2WPKH txs need additional 2W
    const inputsWeight = inputSize * SEGWIT_INPUT_WEIGHT_UNIT;
    const outputWeight = outputSize * SEGWIT_OUTPUT_WEIGHT_UNIT;
    return BigInt(
      Math.ceil(
        ((txBaseWeight + inputsWeight + outputWeight) / 4) * // estimate tx weight and convert to virtual size
          feeRatio,
      ),
    );
  };
}

export default BitcoinRosenChainSDK;
