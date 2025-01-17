type ChainErrorName =
  | "CHAIN_NOT_SUPPORTED_EXCEPTION"
  | "INSUFFICIENT_ASSETS_EXCEPTION";

export class ChainError extends Error {
  name: ChainErrorName;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: ChainErrorName;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class ChainNotSupportedException extends ChainError {
  constructor(message?: string) {
    super({ name: "CHAIN_NOT_SUPPORTED_EXCEPTION", message: message ?? "" });
  }
}

export class InsufficientAssetsException extends ChainError {
  constructor(message?: string) {
    super({ name: "INSUFFICIENT_ASSETS_EXCEPTION", message: message ?? "" });
  }
}
