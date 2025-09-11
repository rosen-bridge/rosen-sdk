export class InsufficientAssetsException extends Error {
  constructor(message?: string) {
    super(`Insufficient assets in selected inputs ${message}`);
  }
}

export class EmptyTokenMapException extends Error {
  constructor() {
    super(`Token map is empty`);
  }
}
