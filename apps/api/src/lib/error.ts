export class ConflictError extends Error {
  status = 409;

  constructor(public message: string) {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  status = 401;

  constructor(public message: string) {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403;

  constructor(public message: string) {
    super(message);
  }
}
