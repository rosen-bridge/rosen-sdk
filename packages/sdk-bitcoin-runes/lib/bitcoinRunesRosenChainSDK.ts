import * as runelib from '@magiceden-oss/runestone-lib';
import * as bitcoinJs from 'bitcoinjs-lib';

import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AssetBalance,
  BitcoinRunesBoxSelection,
  BitcoinRunesUtxo,
} from '@rosen-bridge/bitcoin-runes-utxo-selection';
import {
  AbstractRosenUtxoChainSDK,
  InsufficientAssetsException,
} from '@rosen-bridge/sdk-abstract';
import { NATIVE_TOKEN_IDS, NETWORKS } from '@rosen-bridge/sdk-constant';
import { generateRosenData } from '@rosen-bridge/sdk-utils';
import { TokenMap } from '@rosen-bridge/tokens';

import {
  MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT,
  MINIMUM_BTC_FOR_TAPROOT_OUTPUT,
} from './constants';
import {
  InvalidAddressException,
  InvalidChunkDataException,
  InvalidTaprootInfoException,
  UnsupportedTokenException,
} from './errors';
import { UnsignedPsbtData, NetworkParams } from './types';
import {
  generateFeeEstimatorWithAssumptions,
  isNativeSegWit,
  isTaproot,
  isValidBitcoinRunesAddress,
  makeP2wpkhPayment,
  makeTaprootPayment,
  validateBitcoinRunesUtxo,
} from './utils';

/**
 * Bitcoin Runes Rosen Chain SDK implementation for handling Bitcoin Runes transactions
 */
class BitcoinRunesRosenChainSDK extends AbstractRosenUtxoChainSDK<
  UnsignedPsbtData,
  BitcoinRunesUtxo,
  NetworkParams
> {
  CHAIN = NETWORKS.BITCOIN_RUNES;

  /**
   * Creates an instance of BitcoinRunesRosenChainSDK
   * @param tokenMap
   * @param lockAddress
   * @param logger
   */
  constructor(
    tokenMap: TokenMap,
    lockAddress: string,
    logger?: AbstractLogger,
  ) {
    super(tokenMap, lockAddress, logger);
  }

  /**
   * Generates the core lock transaction for Bitcoin Runes
   * @param tokenId
   * @param toChain
   * @param toEncodedAddress
   * @param fromAddress
   * @param unwrappedAmount
   * @param wrappedBridgeFee
   * @param wrappedNetworkFee
   * @param utxoIterator
   * @param networkParams
   * @returns Unsigned PSBT data
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
      | AsyncIterator<BitcoinRunesUtxo, undefined>
      | Iterator<BitcoinRunesUtxo, undefined>,
    networkParams: NetworkParams,
  ): Promise<UnsignedPsbtData> => {
    if (tokenId === NATIVE_TOKEN_IDS[this.CHAIN])
      throw new UnsupportedTokenException(tokenId);
    const lockData = generateRosenData(
      toChain,
      toEncodedAddress,
      wrappedNetworkFee,
      wrappedBridgeFee,
    );
    const lockDataChunks = lockData.match(/.{1,40}/g);
    if (!lockDataChunks) throw new InvalidChunkDataException(lockData);

    if (!isValidBitcoinRunesAddress(fromAddress))
      throw new InvalidAddressException(fromAddress);

    // validate each utxo as it is pulled, so that the iterator is not consumed
    // before the box selection
    const validatedUtxoIterator: AsyncIterator<BitcoinRunesUtxo, undefined> = {
      next: async () => {
        const iteratorResponse = await utxoIterator.next();
        if (!iteratorResponse.done)
          validateBitcoinRunesUtxo(iteratorResponse.value);
        return iteratorResponse;
      },
    };

    // each data utxo has 1 additional satoshi (294, 295, 296, ...)
    const requiredSatoshiForLockData =
      MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT * BigInt(lockDataChunks.length) +
      BigInt(
        Math.ceil((lockDataChunks.length * (lockDataChunks.length - 1)) / 2),
      );

    const requiredAssets: AssetBalance = {
      nativeToken:
        MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT + requiredSatoshiForLockData,
      tokens: [
        {
          id: tokenId,
          value: unwrappedAmount,
        },
      ],
    };

    const [blockId, txIndex] = tokenId.split(':');
    const tokenIdObj = {
      block: BigInt(blockId),
      tx: Number(txIndex),
    };

    // generate runes data
    const runestone = runelib.encodeRunestone({
      edicts: [
        {
          id: tokenIdObj,
          amount: requiredAssets.tokens[0].value,
          output: 2,
        },
      ],
      pointer: 0,
    });

    const feeEstimator = generateFeeEstimatorWithAssumptions(
      runestone.encodedRunestone.length,
      networkParams.feeRatio,
      lockDataChunks.length + 1, // multiple utxos for data chunks, 1 utxo to lock address
      0,
      fromAddress,
    );

    const boxSelection = new BitcoinRunesBoxSelection(
      this.logger.child('BitcoinRunesBoxSelection'),
    );

    const minChangeBoxValue = isNativeSegWit(fromAddress)
      ? MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT
      : MINIMUM_BTC_FOR_TAPROOT_OUTPUT;
    const coveringBoxes = await boxSelection.getCoveringBoxes(
      requiredAssets,
      [],
      new Map(),
      validatedUtxoIterator,
      minChangeBoxValue,
      undefined,
      feeEstimator,
    );
    if (!coveringBoxes.covered) {
      throw new InsufficientAssetsException(coveringBoxes.uncoveredAssets);
    }

    const signInputs: Record<string, number[]> = {};

    const psbt = new bitcoinJs.Psbt();

    coveringBoxes.boxes.forEach((box, index) => {
      if (!signInputs[box.address!]) signInputs[box.address!] = [];
      signInputs[box.address!].push(index);
      if (isTaproot(box.address!)) {
        if (networkParams.taprootScriptInfo.has(box.address!)) {
          const taprootPayment = makeTaprootPayment(
            networkParams.taprootScriptInfo.get(box.address!)!,
            box.address!,
          );
          psbt.addInput({
            hash: box.txId,
            index: box.index,
            witnessUtxo: {
              script: taprootPayment.output!,
              value: Number(box.value),
            },
            tapInternalKey: taprootPayment.internalPubkey,
          });
        } else throw new InvalidTaprootInfoException(box);
      } else {
        const p2wpkhPayment = makeP2wpkhPayment(box.address!);
        psbt.addInput({
          hash: box.txId,
          index: box.index,
          witnessUtxo: {
            script: p2wpkhPayment.output!,
            value: Number(box.value),
          },
        });
      }
    });

    const changeNativeToken = Number(
      coveringBoxes.additionalAssets.aggregated.nativeToken,
    );

    // add change UTxO
    if (isNativeSegWit(fromAddress)) {
      const p2wpkhPayment = makeP2wpkhPayment(fromAddress);
      psbt.addOutput({
        script: p2wpkhPayment.output!,
        value: changeNativeToken,
      });
    } else {
      const taprootPayment = makeTaprootPayment(
        networkParams.taprootScriptInfo.get(fromAddress)!,
        fromAddress,
      );
      psbt.addOutput({
        value: changeNativeToken,
        script: taprootPayment.output!,
        tapInternalKey: taprootPayment.internalPubkey,
      });
    }

    // OP_RETURN
    psbt.addOutput({
      script: runestone.encodedRunestone,
      value: 0,
    });

    // lock UTxO
    psbt.addOutput({
      script: bitcoinJs.address.toOutputScript(this.lockAddress),
      value: Number(MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT),
    });

    // lock data UTxOs
    lockDataChunks.forEach((chunk, index) => {
      psbt.addOutput({
        script: Buffer.from(`0014${chunk.padEnd(40, '0')}`, 'hex'),
        value: Number(MINIMUM_BTC_FOR_NATIVE_SEGWIT_OUTPUT) + index,
      });
    });

    return {
      psbt: psbt.toBase64(),
      psbtHex: psbt.toHex(),
      signInputs,
    };
  };
}

export default BitcoinRunesRosenChainSDK;
