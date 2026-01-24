import { Psbt, address, payments } from 'bitcoinjs-lib';

import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AssetBalance,
  BitcoinBoxSelection,
  CoveringBoxes,
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
  DOGE_INPUT_SIZE,
  DOGE_NETWORK,
  DOGE_OUTPUT_SIZE,
  DOGE_TX_BASE_SIZE,
  MINIMUM_UTXO_VALUE,
} from './constants';
import {
  MissingNonWitnessUtxoError,
  UnsupportedTokenException,
} from './errors';
import { DogecoinUtxo, NetworkParams, UnsignedPsbtData } from './types';

class DogecoinRosenChainSDK extends AbstractRosenUtxoChainSDK<
  UnsignedPsbtData,
  DogecoinUtxo,
  NetworkParams
> {
  CHAIN = NETWORKS.DOGE;

  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  /**
   * generates an unsigned lock transaction on DogeCoin
   * @param tokenId only doge (native token) is supported
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
      | AsyncIterator<DogecoinUtxo, undefined>
      | Iterator<DogecoinUtxo, undefined>,
    networkParams: NetworkParams,
  ): Promise<UnsignedPsbtData> => {
    if (tokenId !== NATIVE_TOKEN_IDS.doge)
      throw new UnsupportedTokenException(tokenId);

    // generate txBuilder
    const psbt = new Psbt({ network: DOGE_NETWORK });

    const opReturnData = generateRosenData(
      toChain,
      toEncodedAddress,
      wrappedNetworkFee,
      wrappedBridgeFee,
    );
    // generate OP_RETURN box
    const opReturnPayment = payments.embed({
      data: [Buffer.from(opReturnData, 'hex')],
      network: DOGE_NETWORK,
    });
    psbt.addOutput({
      script: opReturnPayment.output!,
      value: 0,
    });

    // generate lock box
    const lockScript = address.toOutputScript(this.lockAddress, DOGE_NETWORK);
    psbt.addOutput({
      script: lockScript,
      value: Number(unwrappedAmount),
    });

    // generate fee estimator
    const txBaseSize =
      DOGE_TX_BASE_SIZE +
      11 + // OP_RETURN output size in bytes
      opReturnData.length / 2; // OP_RETURN size in bytes

    const estimateFee = generateFeeEstimator(
      1,
      txBaseSize,
      DOGE_INPUT_SIZE,
      DOGE_OUTPUT_SIZE,
      networkParams.feeRatio,
      1, // Doge does not use segwit
    );

    const lockAssets: AssetBalance = {
      nativeToken: unwrappedAmount,
      tokens: [],
    };

    const selector = new BitcoinBoxSelection(
      this.logger.child('BitcoinBoxSelection'),
    );
    const selectedBoxes: CoveringBoxes<DogecoinUtxo> =
      await selector.getCoveringBoxes(
        lockAssets,
        [],
        new Map(),
        utxoIterator,
        MINIMUM_UTXO_VALUE,
        undefined,
        estimateFee,
      );
    if (!selectedBoxes.covered) {
      throw new InsufficientAssetsException(selectedBoxes.uncoveredAssets);
    }

    // add inputs
    selectedBoxes.boxes.forEach((box) => {
      if (!networkParams.txToHex[box.txId]) {
        throw new MissingNonWitnessUtxoError(box.txId, box.index);
      }
      psbt.addInput({
        hash: box.txId,
        index: box.index,
        nonWitnessUtxo: Buffer.from(networkParams.txToHex[box.txId], 'hex'),
      });
    });

    // add change box
    const fromAddressScript = address.toOutputScript(fromAddress, DOGE_NETWORK);
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
}

export default DogecoinRosenChainSDK;
