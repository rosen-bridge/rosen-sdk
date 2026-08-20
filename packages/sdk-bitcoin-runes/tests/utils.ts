import {
  RunestoneSpec,
  tryDecodeRunestone,
} from '@magiceden-oss/runestone-lib';
import { Psbt } from 'bitcoinjs-lib';

import { decodeAddress } from '@rosen-bridge/address-codec';
import { BitcoinRunesUtxo } from '@rosen-bridge/bitcoin-runes-utxo-selection';
import { NETWORKS_INDEX } from '@rosen-bridge/sdk-constant';

export type MinimalOnChainRosenData = {
  toChain: string;
  toAddress: string;
  bridgeFee: string;
  networkFee: string;
};

/**
 * extracts rosen data from raw hex data
 * @param lockDataHex
 */
export const parseRosenData = (
  lockDataHex: string,
): MinimalOnChainRosenData => {
  // parse toChain
  const toChainHex = lockDataHex.slice(0, 2);
  const toChainCode = parseInt(toChainHex, 16);
  const toChain = Object.entries(NETWORKS_INDEX).find(
    (chainPair) => chainPair[1] == toChainCode,
  )![0];

  // parse bridgeFee
  const bridgeFeeHex = lockDataHex.slice(2, 18);
  const bridgeFee = BigInt('0x' + bridgeFeeHex).toString();

  // parse networkFee
  const networkFeeHex = lockDataHex.slice(18, 34);
  const networkFee = BigInt('0x' + networkFeeHex).toString();

  // parse toAddress
  const addressLengthCode = lockDataHex.slice(34, 36);
  const addressHex = lockDataHex.slice(
    36,
    36 + parseInt(addressLengthCode, 16) * 2,
  );
  const toAddress = decodeAddress(toChain, addressHex);

  return {
    toChain,
    toAddress,
    bridgeFee,
    networkFee,
  };
};

/**
 * rebuilds the lock data hex from the data outputs of the transaction
 * each data output script is `0014` followed by a 20 bytes chunk of the lock data
 * @param psbt
 * @param firstDataOutputIndex index of the first data output
 */
export const extractLockData = (
  psbt: Psbt,
  firstDataOutputIndex: number,
): string =>
  psbt.txOutputs
    .slice(firstDataOutputIndex)
    .map((output) => output.script.toString('hex').slice(4))
    .join('');

/**
 * decodes the runestone of the transaction
 * @param psbt
 * @returns the decoded runestone
 */
export const extractRunestone = (psbt: Psbt): RunestoneSpec =>
  tryDecodeRunestone({
    vout: psbt.txOutputs.map((output) => ({
      scriptPubKey: { hex: output.script.toString('hex') },
    })),
  }) as RunestoneSpec;

/**
 * wraps utxos in a sync iterator
 * @param utxos
 */
export const toUtxoIterator = (
  utxos: Array<BitcoinRunesUtxo>,
): Iterator<BitcoinRunesUtxo, undefined> => {
  let index = 0;
  return {
    next: () =>
      index < utxos.length
        ? { done: false, value: utxos[index++] }
        : { done: true, value: undefined },
  };
};

/**
 * wraps utxos in an async iterator
 * @param utxos
 */
export const toAsyncUtxoIterator = (
  utxos: Array<BitcoinRunesUtxo>,
): AsyncIterator<BitcoinRunesUtxo, undefined> => {
  const iterator = toUtxoIterator(utxos);
  return {
    next: async () => iterator.next(),
  };
};
