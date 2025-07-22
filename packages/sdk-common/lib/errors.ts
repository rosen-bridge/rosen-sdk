export class TokenNotFoundException extends Error {
  constructor(chain: string, tokenId: string) {
    super(`Token with ID [${tokenId}] not found on chain [${chain}]`);
  }
}

export class ChainNotSupportedException extends Error {
  constructor(tokenId: string) {
    super(`Chain not supported for token with ID [${tokenId}]`);
  }
}

export class FeeRetrievalFailureException extends Error {
  constructor(tokenId?: string) {
    super(`Failed to fetch Minimum fee box for token [${tokenId}]`);
  }
}

export class ImpossibleBehaviorException extends Error {
  constructor(message?: string) {
    super(`ImpossibleBehavior: ${message}`);
  }
}
