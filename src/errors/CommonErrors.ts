type CommonErrorName = "INVALID_ARGUMENT_EXCEPTION";

export class CommonError extends Error {
  name: CommonErrorName;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: CommonErrorName;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class InvalidArgumentException extends CommonError {
  constructor(message?: string) {
    super({ name: "INVALID_ARGUMENT_EXCEPTION", message: message ?? "" });
  }
}
