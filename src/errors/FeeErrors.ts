type FeeErrorName = "FEE_RETRIEVAL_FAILURE";

export class FeeError extends Error {
  name: FeeErrorName;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: FeeErrorName;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class FeeRetrievalFailureException extends FeeError {
  constructor(message?: string) {
    super({ name: "FEE_RETRIEVAL_FAILURE", message: message ?? "" });
  }
}
