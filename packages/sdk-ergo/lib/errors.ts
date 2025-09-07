export class InsufficientAssetsException extends Error {
  constructor(message?: string) {
    super(`Insufficient assets in selected inputs ${message}`);
  }
}
