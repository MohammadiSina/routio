import { Request, Response, NextFunction } from 'express';

import { AppError } from '../utils';
import {
  HttpStatusCode as HSC,
  Status,
  appConstants as ac,
  databaseConstants as dbc,
} from '../constants';
import { DevEnvErrorResponse, PrdEnvErrorResponse } from '../types';

/**
 * Global error handler middleware function for handling errors that occur during request processing.
 * This middleware catches and processes errors propagated through the Express middleware chain.
 * It sets default values for essential error properties if not provided.
 * In the development environment, it responds with detailed error information.
 * In the production environment, it handles potential MongoDB-specific errors and responds accordingly.
 * @param {AppError} err - The error object representing the occurred error.
 * @param {Request} _req - The Express request object representing the HTTP request.
 * @param {Response} res - The Express response object representing the HTTP response.
 * @param {NextFunction} next - The Express next function to invoke the next middleware in the chain.
 * @returns {void}
 */
export default (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure essential error properties are initialized with default values if not provided
  err.status = err.status || Status.ERROR;
  err.statusCode = err.statusCode || HSC.INTERNAL_SERVER_ERROR;

  // If in the development environment, respond with detailed error information;
  // otherwise, handle errors appropriately for production environment
  if (process.env.NODE_ENV === 'development') respondDevError(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error: AppError | undefined;
    const mongoErr = err as IMongoOperationalError;

    if (mongoErr.name === 'ValidationError') error = handleValidation(mongoErr);
    else if (mongoErr.name === 'CastError') error = handleCast();
    else if (mongoErr.code === 11000) error = handleDuplicate(mongoErr);

    respondPrdError(!error ? err : error, res);
  }

  next();
};

/** MongoDB or Mongoose errors not considered operational. */
interface IMongoOperationalError {
  name?: 'CastError' | 'ValidationError';
  code?: number;
  keyValue?: Object;
  errors?: Object;
}

/**
 * Responds to a development environment error by sending an error response with detailed information.
 * @param {AppError} err - The application error object containing error details.
 * @param {Response} res - The Express response object to send the error response.
 * @returns {void}
 */
function respondDevError(err: AppError, res: Response): void {
  res.status(err.statusCode).json(<DevEnvErrorResponse>{
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
}

/**
 * Responds to a production environment error by sending an appropriate error response.
 * If the error is operational (expected behavior), it sends the error message with the provided status code.
 * If the error is not operational, it sends a generic server error message with the status code 500.
 * @param {AppError} err - The application error object containing error details.
 * @param {Response} res - The Express response object to send the error response.
 * @returns {void}
 */
function respondPrdError(err: AppError, res: Response): Response | void {
  // Check if the error is operational (expected behavior)
  if (err.isOperational)
    return res.status(err.statusCode).json(<PrdEnvErrorResponse>{
      status: err.status,
      message: err.message,
    });

  // Respond with a generic server error message and status code
  res.status(HSC.INTERNAL_SERVER_ERROR).json(<PrdEnvErrorResponse>{
    status: Status.ERROR,
    message: ac.APP_PRD_UNKNOWN_ERR,
  });
}

/**
 * Creates an application error object for a casting error, typically encountered during data type conversion.
 * @returns {AppError} An application error object representing a casting error.
 */
function handleCast(): AppError {
  return new AppError(HSC.BAD_REQUEST, dbc.CASTING_ERR);
}

/**
 * Handles a MongoDB duplicate key error by creating an application error object with a corresponding error message.
 * If available, extracts duplicate values from the error object to include in the error message.
 * @param {IMongoOperationalError} err - The MongoDB operational error object representing the duplicate key error.
 * @returns {AppError} An application error object representing the duplicate key error.
 */
function handleDuplicate(err: IMongoOperationalError): AppError {
  // Extract duplicate values, if available, to include in the error message
  const duplicateValues =
    err.keyValue && Object.values(err.keyValue).join(', ');

  // Construct the error message based on whether duplicate values were found
  const message = duplicateValues
    ? `${dbc.DUPLICATE_DETAILED_ERR}: ${duplicateValues}`
    : dbc.DUPLICATE_GENERIC_ERR;

  return new AppError(HSC.BAD_REQUEST, message);
}

/**
 * Handles a MongoDB validation error by creating an application error object with a corresponding error message.
 * Extracts error details from the validation error object and constructs an error message with them.
 * @param {IMongoOperationalError} err - The MongoDB operational error object representing the validation error.
 * @returns {AppError} An application error object representing the validation error.
 */
function handleValidation(err: IMongoOperationalError): AppError {
  const errorDetails = Object.values(err.errors!)
    .map(({ value }: any) => `${value}`)
    .join(', ');

  const message = `${dbc.VALIDATION_ERR}: ${errorDetails}`;

  return new AppError(HSC.BAD_REQUEST, message);
}
