import { Request, Response, NextFunction } from 'express';

import { catchAsync } from '../utils';
import { problemServices as svc } from '../services';
import { HttpStatusCode as HSC, Status } from '../constants';
import { JSendResponse, SolvedProblem } from '../types';

export const createProblem = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const problem = await svc.createProblem(req.body);

    res.status(HSC.CREATED).json(<JSendResponse<SolvedProblem>>{
      status: Status.SUCCESS,
      data: { problem },
    });
  }
);

export const readAllProblem = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.send('The route has not been configured, yet.');
  }
);

export const readProblem = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.send('The route has not been configured, yet.');
  }
);

export const updateProblem = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.send('The route has not been configured, yet.');
  }
);

export const deleteProblem = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    res.send('The route has not been configured, yet.');
  }
);
