import { validate } from 'jsonschema';

import { BaseConfigs, Problem, SolvedProblem } from '../types';
import Broker from '../core/broker';
import { schema as problemSchema } from '../models/problemModel';
import { raise } from '../utils';
import { HttpStatusCode as HSC, problemConstants as pc } from '../constants';

/**
 * Interface representing the request body for solving a problem.
 * @interface SolvingRequestBody
 * @property {Problem} problem - The problem to be solved.
 * @property {Object} configs - Configuration object for solving the problem.
 */
interface SolvingRequestBody {
  problem: Problem;
  configs: Object;
}

/**
 * Validates the request body for solving a problem.
 * @param {SolvingRequestBody} reqBody - The request body containing the problem and configs.
 * @returns {boolean} Returns true if the request body is valid.
 * @throws {AppError} Throws an error if the problem or configs are not provided, or if the problem is not valid.
 */
export function validateReq(reqBody: SolvingRequestBody): boolean {
  const { problem, configs } = reqBody;

  // Check if the problem or configs are provided
  if (!problem || !configs) raise(pc.PROBLEM_NOT_PROVIDED_ERR, HSC.BAD_REQUEST);

  // Validate the problem against the problemSchema
  if (!validate(problem, problemSchema).valid)
    raise(pc.PROBLEM_NOT_VALID_ERR, HSC.BAD_REQUEST);

  return true;
}

/**
 * Solves a problem by validating the request body and delegating the solving process to the Broker.
 * @param {SolvingRequestBody} reqBody - The request body containing the problem and configs to be solved.
 * @returns {Promise<SolvedProblem>} A promise that resolves to the solved problem.
 * @throws {AppError} Throws an error if the request body is invalid or if there's an issue with solving the problem.
 */
export async function solveProblem(
  reqBody: SolvingRequestBody
): Promise<SolvedProblem> {
  // Validate the request body to ensure it contains the required fields
  validateReq(reqBody);

  // Extract the problem and configs from the request body
  const { problem, configs } = reqBody;

  // Delegate the solving process to the Broker and return the result
  return await new Broker(problem).exec(configs as BaseConfigs);
}
