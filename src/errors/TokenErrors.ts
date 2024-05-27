type TokenErrorName = 'TOKEN_NOT_FOUND_ERROR';

export class TokenError extends Error {
  name: TokenErrorName;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: TokenErrorName;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class TokenNotFoundException extends TokenError {
  constructor(message?: string) {
    super({ name: 'TOKEN_NOT_FOUND_ERROR', message: message ?? '' });
  }
}
