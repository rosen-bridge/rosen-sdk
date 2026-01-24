import { Psbt, address, payments } from 'bitcoinjs-lib';

import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AssetBalance,
  BitcoinBoxSelection,
  BitcoinUtxo,
  generateFeeEstimator,
} from '@rosen-bridge/bitcoin-utxo-selection';
import {
  AbstractRosenUtxoChainSDK,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import { NATIVE_TOKEN_IDS, NETWORKS } from '@rosen-bridge/sdk-constant';
import { generateRosenData } from '@rosen-bridge/sdk-utils';
import { TokenMap } from '@rosen-bridge/tokens';

import {
  MINIMUM_NATIVE_TOKEN_AMOUNT,
  SEGWIT_INPUT_WEIGHT_UNIT,
  SEGWIT_OUTPUT_WEIGHT_UNIT,
} from './constants';
import { UnsupportedSourceAddress, UnsupportedTokenException } from './errors';
import { NetworkParams, UnsignedPsbtData } from './types';

class BitcoinRosenChainSDK extends AbstractRosenUtxoChainSDK<
  UnsignedPsbtData,
  BitcoinUtxo,
  NetworkParams
> {
  CHAIN = NETWORKS.BITCOIN;

  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
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
    tokenId: string,
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
    if (!isValid) throw new UnsupportedSourceAddress();

    // generate txBuilder
    const psbt = new Psbt();

    const opReturnData = generateRosenData(
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
    const lockScript = address.toOutputScript(this.lockAddress);
    psbt.addOutput({
      script: lockScript,
      value: Number(unwrappedAmount),
    });

    const minSatoshi = this.getMinimumMeaningfulSatoshi(networkParams.feeRatio);

    const txBaseWeight =
      42 + // all txs include 40W. P2WPKH txs need additional 2W
      44 + // OP_RETURN output base weight
      opReturnData.length * 2; // op_return data weight

    // generate fee estimator
    const estimateFee = generateFeeEstimator(
      1,
      txBaseWeight,
      SEGWIT_INPUT_WEIGHT_UNIT,
      SEGWIT_OUTPUT_WEIGHT_UNIT,
      networkParams.feeRatio,
      4, // the virtual size matters for fee estimation of native-segwit transactions
    );

    const lockAssets: AssetBalance = {
      nativeToken: unwrappedAmount,
      tokens: [],
    };

    const selector = new BitcoinBoxSelection(
      this.logger.child('BitcoinBoxSelection'),
    );
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

    // add change box
    selectedBoxes.additionalAssets.list.forEach((asset) => {
      psbt.addOutput({
        script: fromAddressScript,
        value: Number(asset.nativeToken),
      });
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
   * gets the minimum amount of satoshi for a utxo that can cover
   * additional fee for adding it to a tx
   * Note: it returns the actual value
   * @returns the minimum amount
   */
  getMinimumMeaningfulSatoshi = (feeRatio: number): bigint => {
    return BigInt(
      Math.max(
        Math.ceil(
          (feeRatio * SEGWIT_INPUT_WEIGHT_UNIT) / 4, // estimate fee per weight and convert to virtual size
        ),
        MINIMUM_NATIVE_TOKEN_AMOUNT,
      ),
    );
  };
}

export default BitcoinRosenChainSDK;
