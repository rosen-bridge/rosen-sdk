export class UnsupportedTokenException extends Error {
  constructor(tokenId: string) {
    super(`invalid tokenId [${tokenId}] for bitcoin chain`);
  }
}
