export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter = 30) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export function isRateLimitError(err: unknown): err is RateLimitError {
  return err instanceof RateLimitError;
}
