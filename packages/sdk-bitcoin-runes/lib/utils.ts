import ecc from '@bitcoinerlab/secp256k1';
import * as bitcoinJs from 'bitcoinjs-lib';

import {
  BitcoinRunesUtxo,
  FeeEstimator,
} from '@rosen-bridge/bitcoin-runes-utxo-selection';

import {
  SEGWIT_INPUT_WEIGHT_UNIT,
  SEGWIT_OUTPUT_WEIGHT_UNIT,
  TAPROOT_INPUT_WEIGHT_UNIT,
  TAPROOT_OUTPUT_WEIGHT_UNIT,
} from './constants';
import { InvalidUtxoException } from './errors';

// taproot payments require an elliptic curve implementation to tweak the
// internal pubkey, which bitcoinjs-lib does not bundle
bitcoinJs.initEccLib(ecc);

/**
 * makes a taproot payment object
 * @param internalPubkey
 * @param address
 * @returns taproot payment
 */
export const makeTaprootPayment = (
  internalPubkey: string,
  address: string,
): bitcoinJs.payments.Payment => {
  const payment = bitcoinJs.payments.p2tr({
    internalPubkey: Buffer.from(internalPubkey, 'hex'),
  });

  if (!payment.output) throw Error(`failed to extract taproot output script!`);
  if (!payment.address) throw Error(`failed to extract taproot address!`);
  if (payment.address !== address)
    throw Error(
      `the calculated taproot address by public key is not equal to address!`,
    );

  return payment;
};

/**
 * makes a p2wpkh payment object
 * @param address
 * @returns p2wpkh payment
 */
export const makeP2wpkhPayment = (
  address: string,
): bitcoinJs.payments.Payment => {
  const addressScript = bitcoinJs.address.toOutputScript(address);

  const payment = bitcoinJs.payments.p2wpkh({
    output: addressScript,
  });

  if (!payment.output) throw Error(`failed to extract p2wpkh output script!`);
  if (!payment.address) throw Error(`failed to extract p2wpkh address!`);
  if (payment.address !== address)
    throw Error(
      `the calculated p2wpkh address by public key is not equal to address!`,
    );

  return payment;
};

/**
 * generates fee estimator for tx based on the OP_RETURN data length and type of the outputs
 * @param opReturnScriptLength
 * @param feeRatio
 * @param nativeSegwitOutputSize
 * @param taprootOutputSize
 * @param changeOutputAddress
 * @returns FeeEstimator
 */
export const generateFeeEstimatorWithAssumptions = (
  opReturnScriptLength: number,
  feeRatio: number,
  nativeSegwitOutputSize: number,
  taprootOutputSize: number,
  changeOutputAddress: string,
): FeeEstimator<BitcoinRunesUtxo> => {
  return (
    selectedBoxes: Array<BitcoinRunesUtxo>,
    changeBoxesCount: number,
  ): bigint => {
    let nativeSegwitInputsNumber = 0;
    let taprootInputsNumber = 0;
    selectedBoxes.forEach((box) => {
      if (isTaproot(box.address!)) taprootInputsNumber += 1;
      else if (isNativeSegWit(box.address!)) nativeSegwitInputsNumber += 1;
    });

    // consider type of change output script
    // Note: the assumed output sizes are copied, so that repeated calls of the
    // estimator do not accumulate the change outputs
    let taprootOutputsNumber = taprootOutputSize;
    let nativeSegwitOutputsNumber = nativeSegwitOutputSize;
    if (isTaproot(changeOutputAddress))
      taprootOutputsNumber += changeBoxesCount;
    else if (isNativeSegWit(changeOutputAddress))
      nativeSegwitOutputsNumber += changeBoxesCount;

    const estimatedVsize = estimateTxVsize(
      taprootInputsNumber,
      nativeSegwitInputsNumber,
      opReturnScriptLength,
      nativeSegwitOutputsNumber,
      taprootOutputsNumber,
    );
    return BigInt(Math.ceil(estimatedVsize * feeRatio));
  };
};

/**
 * estimates the virtual size of the transaction based on the number of inputs, OP_RETURN output script, number of native segwit and taproot outputs
 * @param taprootInputSize
 * @param nativeSegwitInputSize
 * @param opReturnScriptLength
 * @param nativeSegwitOutputSize
 * @param taprootOutputSize
 * @returns estimated fee
 */
const estimateTxVsize = (
  taprootInputSize: number,
  nativeSegwitInputSize: number,
  opReturnScriptLength: number,
  nativeSegwitOutputSize: number,
  taprootOutputSize: number,
): number => {
  const txBaseWeight = 40 + 2; // all txs include 40W. P2WPKH txs need additional 2W
  const opReturnWeightUnit =
    36 + // OP_RETURN base output weight
    opReturnScriptLength * 4; // OP_RETURN output data counts as vSize, so weight = script length * 4
  const inputsWeight =
    taprootInputSize * TAPROOT_INPUT_WEIGHT_UNIT +
    nativeSegwitInputSize * SEGWIT_INPUT_WEIGHT_UNIT;
  const outputWeight =
    nativeSegwitOutputSize * SEGWIT_OUTPUT_WEIGHT_UNIT +
    taprootOutputSize * TAPROOT_OUTPUT_WEIGHT_UNIT;

  return (txBaseWeight + inputsWeight + opReturnWeightUnit + outputWeight) / 4;
};

/**
 * check if an address is native segwit or not
 * @param address
 * @returns boolean
 */
export const isNativeSegWit = (address: string): boolean => {
  return address.toLowerCase().startsWith('bc1q');
};

/**
 * check if an address is taproot or not
 * @param address
 * @returns boolean
 */
export const isTaproot = (address: string): boolean => {
  return address.toLowerCase().startsWith('bc1p');
};

/**
 * check if an address is valid bitcoin rune address or not
 * @param address
 * @returns boolean
 */
export const isValidBitcoinRunesAddress = (address: string) => {
  const isTaprootBool = isTaproot(address);

  const isNativeSegwitBool = isNativeSegWit(address);

  return isTaprootBool || isNativeSegwitBool;
};

/**
 * validate bitcoin rune utxo
 * @param utxo
 */
export const validateBitcoinRunesUtxo = (utxo: BitcoinRunesUtxo) => {
  if (!utxo.address || !isValidBitcoinRunesAddress(utxo.address))
    throw new InvalidUtxoException(utxo);
};
