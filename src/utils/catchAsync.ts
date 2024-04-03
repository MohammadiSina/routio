import { Request, Response, NextFunction as NF, RequestHandler } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NF
) => Promise<void>;

/**
 * Wraps an asynchronous route handler function to catch any errors and pass them to the Express error handling middleware.
 * @param {AsyncRouteHandler} fn The asynchronous route handler function.
 * @returns {RequestHandler} An asynchronous function that executes the route handler and catches any errors.
 */
const catchAsync = (fn: AsyncRouteHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NF): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default catchAsync;
