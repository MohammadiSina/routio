import { Status } from '../constants';
import { AppError } from '../utils';

/**
 * Represents a response format following the JSend specification with a little customization.
 * The response can indicate success with data or failure with an error message.
 * https://github.com/omniti-labs/jsend
 * @template T The type of data included in the response.
 */
export type JSendResponse<T> =
  | {
      status: Status.SUCCESS;
      count?: number;
      data: Record<string, T> | Record<string, T[]> | null;
    }
  | {
      status: FailureStatus;
      message: string;
    };

// Represents the structure of an error response in the development environment.
// Used within the global error handler to format detailed error responses.
export type DevEnvErrorResponse = {
  status: FailureStatus;
  message: string;
  error: AppError;
  stack: string;
};

// Represents the structure of an error response in the production environment.
// Used within the global error handler to format concise error responses.
export type PrdEnvErrorResponse = {
  status: FailureStatus;
  message: string;
};

type FailureStatus = Status.FAIL | Status.ERROR;
