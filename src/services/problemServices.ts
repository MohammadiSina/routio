import repository from '../repositories/problemRepository';
import { SolvedProblem, IProblemDoc } from '../types';
import { AppError } from '../utils';
import { HttpStatusCode as HSC, problemConstants as pc } from '../constants';

/**
 * Creates a new problem document in the database.
 * @param {SolvedProblem} problem - The solved problem object to be created.
 * @returns {Promise<IProblemDoc>} A promise that resolves to the created problem document.
 * @throws {AppError} Throws a bad request error if the provided problem is not valid.
 */
export const createProblem = async (
  problem: SolvedProblem
): Promise<IProblemDoc> => {
  // Problem basic validation process
  if (Array.isArray(problem) || Object.keys(problem).length === 0)
    throw new AppError(HSC.BAD_REQUEST, pc.PROBLEM_NOT_PROVIDED_ERR);

  return await repository.create(problem);
};
