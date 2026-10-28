export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** Thrown when an action would exceed an active item limit. */
export class LimitError extends Error {
  readonly limit: number;

  constructor(message: string, limit: number) {
    super(message);
    this.name = "LimitError";
    this.limit = limit;
    Object.setPrototypeOf(this, LimitError.prototype);
  }
}
