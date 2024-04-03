import { Status, HttpStatusCode } from '../constants';

export default class AppError extends Error {
  status: Status;
  readonly isOperational = true;

  /**
   * Creates an instance of AppError.
   * @param {HttpStatusCode} statusCode - The HTTP status code of the error.
   * @param {string} message - The error message.
   */

  constructor(public statusCode: HttpStatusCode, message: string) {
    super(message);

    // Determine the status based on the HTTP status code.
    this.status = `${this.statusCode}`.startsWith('4')
      ? Status.FAIL
      : Status.ERROR;

    // Remove the AppError class itself from the error stack trace.
    Error.captureStackTrace(this, this.constructor);
  }
}
