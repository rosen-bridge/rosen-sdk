import { BitcoinRunesUtxo } from '@rosen-bridge/bitcoin-runes-utxo-selection';

export class UnsupportedTokenException extends Error {
  constructor(tokenId: string) {
    super(`invalid tokenId [${tokenId}] for bitcoin chain`);
  }
}

export class InvalidChunkDataException extends Error {
  constructor(lockData: string) {
    super(`Failed to split lock data [${lockData}] into chunks`);
  }
}

export class InvalidAddressException extends Error {
  constructor(address: string) {
    super(
      `The address field [${address}] is invalid. It should be a taproot or native segwit address.`,
    );
  }
}

export class InvalidUtxoException extends Error {
  constructor(utxo: BitcoinRunesUtxo) {
    super(
      `The provided utxo [${utxo.txId}.${utxo.index}] with address [${utxo.address}] is invalid. Bitcoin runes utxos require a taproot or native segwit address.`,
    );
  }
}

export class InvalidTaprootInfoException extends Error {
  constructor(utxo: BitcoinRunesUtxo) {
    super(
      `The provided utxo [${utxo.txId}.${utxo.index}] with address [${utxo.address}] is invalid. Bitcoin runes utxos with taproot script should provide a valid internalPubkey in taprootScriptInfo.`,
    );
  }
}
