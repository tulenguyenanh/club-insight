/** Errors a caller can act on. Anything else is reported as an internal error. */
export class NotFoundError extends Error {
  readonly code = "not_found";
}

export class InvalidRequestError extends Error {
  readonly code = "invalid_request";
}
