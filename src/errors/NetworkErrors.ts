type NetworkErrorName = "NETWORK_CONNECTION_EXCEPTION";

export class NetworkError extends Error {
  name: NetworkErrorName;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: NetworkErrorName;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class NetworkConnectionException extends NetworkError {
  constructor(message?: string) {
    super({ name: "NETWORK_CONNECTION_EXCEPTION", message: message ?? "" });
  }
}
