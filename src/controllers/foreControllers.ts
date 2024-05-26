import { Request, Response, NextFunction as NF } from 'express';

import { foreServices as svc } from '../services';
import { catchAsync } from '../utils';
import { JSendResponse, SolvedProblem } from '../types';
import { HttpStatusCode as HSC, Status } from '../constants';

/**
 * Controller function to solve a problem based on the request body.
 * @param {Request} req - Express Request object containing the problem to be solved.
 * @param {Response} res - Express Response object to send the solved problem in the response.
 * @param {NextFunction} _next - Express NextFunction object (unused in controllers).
 * @returns {Promise<void>} A promise that resolves when the problem is solved and the response is sent.
 */
export const solveProblem = catchAsync(
  async (req: Request, res: Response, _next: NF) => {
    // Solve the problem using the solveProblem service (handles validation internally)
    const solvedProblem = await svc.solveProblem(req.body);

    // Send the solved problem in the response
    res.status(HSC.OK).json(<JSendResponse<SolvedProblem>>{
      status: Status.SUCCESS,
      data: { solvedProblem },
    });
  }
);
