export class UnsupportedTokenException extends Error {
  constructor(tokenId: string) {
    super(`invalid tokenId [${tokenId}] for bitcoin chain`);
  }
}

export class UnsupportedAddress extends Error {
  constructor() {
    super(`The fromAddress is not native SegWit (P2WPKH or P2WSH).`);
  }
}
