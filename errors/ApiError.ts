import { Response } from "express";
import { Result, ValidationError } from "express-validator";

class ApiError extends Error {
  public message: string;
  public status: number;
  public res: Response;
  public errors: Result<ValidationError> | undefined;

  constructor(
    res: Response,
    status: number,
    message: string,
    errors?: Result<ValidationError>
  ) {
    super();
    this.status = status;
    this.message = message;
    if (errors) this.errors = errors;
    this.res = res
      .status(this.status)
      .json({ message: this.message, errors: this.errors });
  }

  static badRequest(
    res: Response,
    message: string,
    errors?: Result<ValidationError>
  ) {
    return new ApiError(res, 404, message, errors).res;
  }

  static internal(res: Response, message: string) {
    return new ApiError(res, 500, message).res;
  }

  static forbidden(res: Response, message: string) {
    return new ApiError(res, 403, message).res;
  }

  static unauthorized(res: Response, message: string) {
    return new ApiError(res, 401, message).res;
  }
}

export default ApiError;
