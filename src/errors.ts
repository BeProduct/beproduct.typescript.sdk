export class BeProductError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly url: string,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = "BeProductError";
  }
}

export class BeProductThrottleError extends BeProductError {
  constructor(
    url: string,
    public readonly retryAfterSeconds?: number,
    public readonly window?: string,
    public readonly limit?: number,
  ) {
    super(
      `Rate limit exceeded${window ? ` (${window}, limit: ${limit})` : ""}. Retry after ${retryAfterSeconds ?? "unknown"}s`,
      429,
      url,
    );
    this.name = "BeProductThrottleError";
  }
}

export class BeProductValidationError extends BeProductError {
  constructor(url: string, responseBody?: string) {
    super("Validation error", 400, url, responseBody);
    this.name = "BeProductValidationError";
  }
}
